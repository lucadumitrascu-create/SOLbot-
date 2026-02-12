import express, { Request, Response, NextFunction } from "express";
import path from "path";
import crypto from "crypto";
import { config } from "./config";
import { getConnection } from "./wallet";
import { supabase } from "./supabase-config";
import { getBotKeypair } from "./bot-wallet";
import { sendSol, swapWithJupiter } from "./trader";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

const app = express();
app.use(express.json());
app.use(express.static(path.resolve(__dirname, "..")));

// ══════════════════════════════════════════
//  Token Utils (HMAC-SHA256 signed)
// ══════════════════════════════════════════

function createToken(wallet: string): string {
  const payload = Buffer.from(JSON.stringify({ wallet, iat: Date.now() })).toString("base64url");
  const sig = crypto.createHmac("sha256", config.jwtSecret).update(payload).digest("base64url");
  return payload + "." + sig;
}

function verifyToken(token: string): { wallet: string; iat: number } | null {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", config.jwtSecret).update(payload).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════
//  Ed25519 Signature Verification
// ══════════════════════════════════════════

const ED25519_DER_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function verifyEd25519(message: Buffer, signature: Buffer, publicKey: Buffer): boolean {
  try {
    return crypto.verify(null, message, {
      key: Buffer.concat([ED25519_DER_PREFIX, publicKey]),
      format: "der",
      type: "spki",
    }, signature);
  } catch {
    return false;
  }
}

// ══════════════════════════════════════════
//  Auth Middleware (Phantom Wallet)
// ══════════════════════════════════════════

interface AuthRequest extends Request {
  wallet?: string;
}

function authRequired(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization required" });
  }
  const data = verifyToken(header.slice(7));
  if (!data) return res.status(401).json({ error: "Invalid or expired token" });
  req.wallet = data.wallet;
  next();
}

// ══════════════════════════════════════════
//  Public Routes
// ══════════════════════════════════════════

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", network: config.network, uptime: process.uptime() });
});

// ── Phantom Auth: verify signature → upsert user → return token ──
app.post("/api/auth/phantom", async (req: Request, res: Response) => {
  try {
    const { walletAddress, signature, message } = req.body;
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: "walletAddress, signature, and message required" });
    }

    const pubkeyBytes = new PublicKey(walletAddress).toBytes();
    const messageBytes = Buffer.from(message, "utf8");
    const signatureBytes = Buffer.from(signature, "base64");

    const isValid = verifyEd25519(messageBytes, signatureBytes, Buffer.from(pubkeyBytes));
    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Upsert user in Supabase
    await supabase.from("users").upsert(
      { wallet_address: walletAddress },
      { onConflict: "wallet_address" }
    );

    const token = createToken(walletAddress);
    res.json({ token, walletAddress });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Verify Session ──
app.get("/api/auth/session", authRequired, (req: AuthRequest, res: Response) => {
  res.json({ walletAddress: req.wallet });
});

// ══════════════════════════════════════════
//  Protected Routes
// ══════════════════════════════════════════

// ── Get Bot Wallet ──
app.get("/api/bot-wallet", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("bot_wallets")
      .select("public_key, created_at")
      .eq("wallet_address", req.wallet!)
      .single();
    if (error || !data) return res.json({ exists: false });
    res.json({ exists: true, publicKey: data.public_key, createdAt: data.created_at });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Create Bot Wallet (auto-generate keypair) ──
app.post("/api/bot-wallet", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const { data: existing } = await supabase
      .from("bot_wallets")
      .select("public_key")
      .eq("wallet_address", req.wallet!)
      .single();
    if (existing) {
      return res.json({ publicKey: existing.public_key, message: "Wallet already exists" });
    }

    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const privateKey = bs58.encode(keypair.secretKey);

    const { error } = await supabase.from("bot_wallets").insert({
      wallet_address: req.wallet!,
      public_key: publicKey,
      private_key: privateKey,
    });
    if (error) throw error;

    res.json({ publicKey, message: "Bot wallet created" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Send SOL ──
app.post("/api/trade/send", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const { recipient, amount } = req.body;
    if (!recipient || !amount) {
      return res.status(400).json({ error: "recipient and amount required" });
    }
    const keypair = await getBotKeypair(req.wallet!);
    const conn = getConnection();
    const sig = await sendSol(conn, keypair, recipient, Number(amount));
    res.json({ signature: sig });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Swap via Jupiter ──
app.post("/api/trade/swap", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const { tokenMint, amount, side } = req.body;
    if (!tokenMint || !amount || !side) {
      return res.status(400).json({ error: "tokenMint, amount, and side required" });
    }
    const keypair = await getBotKeypair(req.wallet!);
    const conn = getConnection();
    const sig = await swapWithJupiter(conn, keypair, {
      tokenMint,
      amount: Number(amount),
      side,
    });
    res.json({ signature: sig });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Wallet Balance ──
app.get("/api/trade/balance", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const keypair = await getBotKeypair(req.wallet!);
    const conn = getConnection();
    const balance = await conn.getBalance(keypair.publicKey);
    res.json({
      address: keypair.publicKey.toBase58(),
      balance: balance / LAMPORTS_PER_SOL,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.resolve(__dirname, "..", "index.html"));
});

// ══════════════════════════════════════════
//  Start
// ══════════════════════════════════════════
const PORT = Number(process.env.PORT || 3000);

async function start() {
  console.log("\n  SOLbot - Trading Engine\n");
  getConnection();
  console.log(`  Network   : ${config.network}`);
  console.log(`  Auth      : Phantom Wallet`);
  console.log(`  Storage   : Supabase`);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`  Dashboard : http://localhost:${PORT}`);
    console.log(`  API       : http://localhost:${PORT}/api/health\n`);
  });
}

start().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
