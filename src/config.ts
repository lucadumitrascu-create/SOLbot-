import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

export const config = {
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(48).toString("base64url"),
  rpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  network: process.env.SOLANA_NETWORK || "mainnet-beta",
  slippageBps: Number(process.env.SLIPPAGE_BPS || "50"),
  maxSolPerTrade: Number(process.env.MAX_SOL_PER_TRADE || "0.1"),
};
