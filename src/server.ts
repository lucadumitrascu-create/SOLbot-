import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { config } from "./config";
import { getConnection } from "./wallet";
import { supabase } from "./supabase-config";
import { storePrivateKey, getUser, removePrivateKey, ensureLocalUser } from "./store";
import { getUserBalance, custodialSendSol, custodialSwap, validatePrivateKey } from "./custodial";
import { Connection } from "@solana/web3.js";

const app = express();
app.use(express.json());

// Serve landing page
app.use(express.static(path.resolve(__dirname, "..")));

let connection: Connection;

// ══════════════════════════════════════════
//  Auth Middleware (Supabase)
// ══════════════════════════════════════════

interface AuthPayload {
  userId: string;
  email: string;
}

interface AuthRequest extends Request {
  user?: AuthPayload;
}

async function authRequired(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization required" });
    }
    const accessToken = header.slice(7);

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Auto-create local user record if needed
    ensureLocalUser(user.id, user.email || "");

    req.user = { userId: user.id, email: user.email || "" };
    next();
  } catch {
    res.status(401).json({ error: "Authentication failed" });
  }
}

// ══════════════════════════════════════════
//  Public Routes
// ══════════════════════════════════════════

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", network: config.network, uptime: process.uptime() });
});

// ══════════════════════════════════════════
//  Protected Routes (require Supabase auth)
// ══════════════════════════════════════════

// ── Store private key ──
app.post("/api/vault/key", authRequired, (req: AuthRequest, res: Response) => {
  try {
    const { privateKey } = req.body;
    if (!privateKey) {
      return res.status(400).json({ error: "privateKey required" });
    }
    const publicAddress = validatePrivateKey(privateKey);
    storePrivateKey(req.user!.userId, privateKey, publicAddress);
    res.json({ publicAddress, message: "Key encrypted and stored" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ── Remove stored key ──
app.delete("/api/vault/key", authRequired, (req: AuthRequest, res: Response) => {
  try {
    removePrivateKey(req.user!.userId);
    res.json({ message: "Key removed" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ── Get profile + wallet ──
app.get("/api/me", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const user = getUser(req.user!.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    let balance = null;
    if (user.privateKey) {
      try {
        const info = await getUserBalance(req.user!.userId);
        balance = info.balance;
      } catch {
        balance = null;
      }
    }

    res.json({
      id: user.id,
      email: user.email,
      publicAddress: user.publicAddress,
      hasKey: !!user.privateKey,
      balance,
      network: config.network,
    });
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
    const sig = await custodialSendSol(req.user!.userId, recipient, Number(amount));
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
    const sig = await custodialSwap(req.user!.userId, {
      tokenMint,
      amount: Number(amount),
      side,
    });
    res.json({ signature: sig });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Wallet balance ──
app.get("/api/trade/balance", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const info = await getUserBalance(req.user!.userId);
    res.json(info);
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
  console.log("\n  SOLbot - Custodial Trading Engine\n");
  connection = getConnection();
  console.log(`  Network   : ${config.network}`);
  console.log(`  Auth      : Supabase`);
  console.log(`  Storage   : Local (operator-controlled)`);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`  Dashboard : http://localhost:${PORT}`);
    console.log(`  API       : http://localhost:${PORT}/api/health\n`);
  });
}

start().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
