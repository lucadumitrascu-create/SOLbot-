import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { config } from "./config";

/**
 * Creates a Keypair from the base58 private key in .env
 * The key is only held in memory — never written to disk.
 */
export function loadWallet(): Keypair {
  try {
    const secretKey = bs58.decode(config.privateKey);
    return Keypair.fromSecretKey(secretKey);
  } catch {
    console.error("Invalid private key format. Expected a base58-encoded key.");
    console.error("You can export it from Phantom: Settings > Security > Export Private Key");
    process.exit(1);
  }
}

/** Get a reusable Connection to the Solana cluster */
export function getConnection(): Connection {
  return new Connection(config.rpcUrl, "confirmed");
}

/** Fetch and display wallet balances */
export async function printWalletInfo(connection: Connection, wallet: Keypair): Promise<void> {
  const pubkey = wallet.publicKey;
  const balanceLamports = await connection.getBalance(pubkey);
  const balanceSol = balanceLamports / LAMPORTS_PER_SOL;

  console.log("=== Wallet Info ===");
  console.log(`  Address : ${pubkey.toBase58()}`);
  console.log(`  Network : ${config.network}`);
  console.log(`  Balance : ${balanceSol.toFixed(4)} SOL`);
  console.log("===================\n");
}

/** Request an airdrop on devnet (for testing) */
export async function requestDevnetAirdrop(
  connection: Connection,
  pubkey: PublicKey,
  solAmount: number = 1,
): Promise<string> {
  if (config.network !== "devnet") {
    throw new Error("Airdrop is only available on devnet");
  }
  console.log(`Requesting ${solAmount} SOL airdrop on devnet...`);
  const sig = await connection.requestAirdrop(pubkey, solAmount * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(sig);
  console.log(`Airdrop confirmed: ${sig}`);
  return sig;
}
