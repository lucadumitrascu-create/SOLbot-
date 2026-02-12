import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { supabase } from "../services/supabase.js";

interface JwtPayload {
  wallet: string;
}

export async function walletsRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });

  // GET /wallets - list user's bot wallets
  app.get("/", async (request: FastifyRequest) => {
    const { wallet } = request.user as JwtPayload;

    const { data, error } = await supabase
      .from("bot_wallets")
      .select("id, public_key, label, sol_balance, created_at")
      .eq("user_wallet", wallet)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  });

  // POST /wallets - create a new bot wallet
  app.post(
    "/",
    async (
      request: FastifyRequest<{ Body: { label?: string } }>,
      reply: FastifyReply
    ) => {
      const { wallet } = request.user as JwtPayload;
      const { label } = request.body || {};

      // Generate new Solana keypair
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toBase58();
      const privateKey = bs58.encode(keypair.secretKey);

      // Store in database (private key should be encrypted in production)
      const { data, error } = await supabase
        .from("bot_wallets")
        .insert({
          user_wallet: wallet,
          public_key: publicKey,
          encrypted_private_key: privateKey,
          label: label || `Wallet ${Date.now()}`,
          sol_balance: 0,
        })
        .select("id, public_key, label, sol_balance, created_at")
        .single();

      if (error) {
        return reply.code(500).send({ error: error.message });
      }

      return { success: true, data };
    }
  );

  // DELETE /wallets/:id
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { wallet } = request.user as JwtPayload;
      const { id } = request.params;

      const { error } = await supabase
        .from("bot_wallets")
        .delete()
        .eq("id", id)
        .eq("user_wallet", wallet);

      if (error) {
        return reply.code(500).send({ error: error.message });
      }

      return { success: true };
    }
  );
}
