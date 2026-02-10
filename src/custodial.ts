import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import { getUserKey } from "./store";
import { sendSol, swapWithJupiter, TradeParams } from "./trader";
import { getConnection } from "./wallet";

function loadKeypair(userId: string): Keypair {
  const keyBase58 = getUserKey(userId);
  return Keypair.fromSecretKey(bs58.decode(keyBase58));
}

export async function getUserBalance(userId: string): Promise<{ address: string; balance: number }> {
  const keypair = loadKeypair(userId);
  const connection = getConnection();
  const balance = await connection.getBalance(keypair.publicKey);
  return { address: keypair.publicKey.toBase58(), balance: balance / LAMPORTS_PER_SOL };
}

export async function custodialSendSol(userId: string, recipient: string, amount: number): Promise<string> {
  const keypair = loadKeypair(userId);
  const connection = getConnection();
  return sendSol(connection, keypair, recipient, amount);
}

export async function custodialSwap(userId: string, params: TradeParams): Promise<string> {
  const keypair = loadKeypair(userId);
  const connection = getConnection();
  return swapWithJupiter(connection, keypair, params);
}

export function validatePrivateKey(keyBase58: string): string {
  try {
    const keypair = Keypair.fromSecretKey(bs58.decode(keyBase58));
    return keypair.publicKey.toBase58();
  } catch {
    throw new Error("Invalid private key format");
  }
}
