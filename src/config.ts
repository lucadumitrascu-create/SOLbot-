import dotenv from "dotenv";
import path from "path";

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
  /** Base58-encoded private key — loaded from .env, never hardcoded */
  privateKey: requireEnv("SOLANA_PRIVATE_KEY"),

  /** Solana RPC endpoint */
  rpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",

  /** Network name */
  network: process.env.SOLANA_NETWORK || "devnet",

  /** Max slippage in basis points (50 = 0.5%) */
  slippageBps: Number(process.env.SLIPPAGE_BPS || "50"),

  /** Maximum SOL to spend per trade */
  maxSolPerTrade: Number(process.env.MAX_SOL_PER_TRADE || "0.1"),
};
