import { createClient } from "@supabase/supabase-js";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ktfnwdxrgdkrklctiexj.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_wOj6NbvDIrcM-Yt2pKbVAQ_xQJPXBP9";

/**
 * Fetch the bot wallet keypair from Supabase for a given user.
 * Requires the user's Supabase access token (for RLS).
 */
export async function getBotKeypair(accessToken: string, userId: string): Promise<Keypair> {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data, error } = await client
    .from("bot_wallets")
    .select("private_key")
    .eq("user_id", userId)
    .single();

  if (error || !data?.private_key) {
    throw new Error("Bot wallet not found. Complete setup first.");
  }

  return Keypair.fromSecretKey(bs58.decode(data.private_key));
}
