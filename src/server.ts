import express from "express";
import path from "path";
import { loadWallet, getConnection, printWalletInfo } from "./wallet";
import { sendSol, swapWithJupiter } from "./trader";
import { config } from "./config";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

const app = express();
app.use(express.json());

// Serve landing page
app.use(express.static(path.resolve(__dirname, "..")));

let wallet: Keypair;
let connection: Connection;

// ── API Routes ──

// Wallet info
app.get("/api/wallet", async (_req, res) => {
  try {
    const balance = await connection.getBalance(wallet.publicKey);
    res.json({
      address: wallet.publicKey.toBase58(),
      balance: balance / LAMPORTS_PER_SOL,
      network: config.network,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Send SOL
app.post("/api/send", async (req, res) => {
  try {
    const { recipient, amount } = req.body;
    if (!recipient || !amount) {
      return res.status(400).json({ error: "recipient and amount required" });
    }
    const sig = await sendSol(connection, wallet, recipient, amount);
    res.json({ signature: sig });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Swap via Jupiter
app.post("/api/swap", async (req, res) => {
  try {
    const { tokenMint, amount, side } = req.body;
    if (!tokenMint || !amount || !side) {
      return res.status(400).json({ error: "tokenMint, amount, and side required" });
    }
    const sig = await swapWithJupiter(connection, wallet, { tokenMint, amount, side });
    res.json({ signature: sig });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ── Start ──
const PORT = Number(process.env.PORT || 3000);

async function start() {
  console.log("\n  SOLbot - Autonomous Trading Engine\n");

  wallet = loadWallet();
  connection = getConnection();
  await printWalletInfo(connection, wallet);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`  Dashboard : http://localhost:${PORT}`);
    console.log(`  API       : http://localhost:${PORT}/api/wallet`);
    console.log(`  Network   : ${config.network}\n`);
  });
}

start().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
