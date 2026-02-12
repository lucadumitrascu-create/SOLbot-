import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

let connection: Connection | null = null;

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(RPC_URL, "confirmed");
  }
  return connection;
}

export async function getSolBalance(publicKey: string): Promise<number> {
  const conn = getConnection();
  const balance = await conn.getBalance(new PublicKey(publicKey));
  return balance / LAMPORTS_PER_SOL;
}

export async function getRecentBlockhash(): Promise<string> {
  const conn = getConnection();
  const { blockhash } = await conn.getLatestBlockhash();
  return blockhash;
}
