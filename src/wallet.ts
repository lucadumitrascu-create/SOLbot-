import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { config } from "./config";

/** Get a reusable Connection to the Solana cluster */
export function getConnection(): Connection {
  return new Connection(config.rpcUrl, "confirmed");
}
