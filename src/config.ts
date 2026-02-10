import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`\n  Missing required environment variable: ${name}`);
    console.error(`  Create a .env file based on .env.example:\n`);
    console.error(`    cp .env.example .env\n`);
    process.exit(1);
  }
  return value;
}

export const config = {
  /** Master key for encrypting user private keys at rest (AES-256-GCM) */
  vaultMasterKey: requireEnv("VAULT_MASTER_KEY"),

  /** JWT signing secret */
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(48).toString("base64url"),

  /** Solana RPC endpoint */
  rpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",

  /** Network name */
  network: process.env.SOLANA_NETWORK || "mainnet-beta",

  /** Max slippage in basis points (50 = 0.5%) */
  slippageBps: Number(process.env.SLIPPAGE_BPS || "50"),

  /** Maximum SOL to spend per trade */
  maxSolPerTrade: Number(process.env.MAX_SOL_PER_TRADE || "0.1"),
};
