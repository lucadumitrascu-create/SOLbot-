import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import { getDecryptedKey } from "./store";
import { sendSol, swapWithJupiter, TradeParams } from "./trader";
import { getConnection } from "./wallet";

/**
 * Loads a user's keypair from encrypted storage, executes an action,
 * then ensures the key material is discarded from memory.
 */
async function withUserKeypair<T>(
  userId: string,
  action: (keypair: Keypair, connection: Connection) => Promise<T>,
): Promise<T> {
  let secretBytes: Uint8Array | null = null;
  try {
    const keyBase58 = getDecryptedKey(userId);
    secretBytes = bs58.decode(keyBase58);
    const keypair = Keypair.fromSecretKey(secretBytes);
    const connection = getConnection();
    return await action(keypair, connection);
  } finally {
    // Zero out key material from memory
    if (secretBytes) {
      secretBytes.fill(0);
    }
  }
}

/**
 * Get wallet balance for a custodial user.
 */
export async function getUserBalance(userId: string): Promise<{
  address: string;
  balance: number;
}> {
  return withUserKeypair(userId, async (keypair, connection) => {
    const balance = await connection.getBalance(keypair.publicKey);
    return {
      address: keypair.publicKey.toBase58(),
      balance: balance / LAMPORTS_PER_SOL,
    };
  });
}

/**
 * Send SOL on behalf of a custodial user.
 */
export async function custodialSendSol(
  userId: string,
  recipient: string,
  amount: number,
): Promise<string> {
  return withUserKeypair(userId, async (keypair, connection) => {
    return sendSol(connection, keypair, recipient, amount);
  });
}

/**
 * Swap tokens via Jupiter on behalf of a custodial user.
 */
export async function custodialSwap(
  userId: string,
  params: TradeParams,
): Promise<string> {
  return withUserKeypair(userId, async (keypair, connection) => {
    return swapWithJupiter(connection, keypair, params);
  });
}

/**
 * Validate that a base58 private key is valid and return its public address.
 */
export function validatePrivateKey(keyBase58: string): string {
  try {
    const secret = bs58.decode(keyBase58);
    const keypair = Keypair.fromSecretKey(secret);
    // Zero the secret
    secret.fill(0);
    return keypair.publicKey.toBase58();
  } catch {
    throw new Error("Invalid private key format");
  }
}
