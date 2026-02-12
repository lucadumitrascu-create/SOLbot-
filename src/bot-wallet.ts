import { supabase } from "./supabase-config";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

/**
 * Fetch the bot wallet keypair from Supabase for a given phantom wallet address.
 */
export async function getBotKeypair(walletAddress: string): Promise<Keypair> {
  const { data, error } = await supabase
    .from("bot_wallets")
    .select("private_key")
    .eq("wallet_address", walletAddress)
    .single();

  if (error || !data?.private_key) {
    throw new Error("Bot wallet not found. Complete setup first.");
  }

  return Keypair.fromSecretKey(bs58.decode(data.private_key));
}
