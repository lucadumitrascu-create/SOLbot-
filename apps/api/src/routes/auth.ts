import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { supabase } from "../services/supabase.js";
import { createSignInMessage, isValidSolanaAddress } from "@solbot/shared";

// In-memory nonce store (replace with Redis in production)
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

function generateNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function authRoutes(app: FastifyInstance) {
  // GET /auth/challenge?wallet=<address>
  app.get(
    "/challenge",
    async (
      request: FastifyRequest<{ Querystring: { wallet: string } }>,
      reply: FastifyReply
    ) => {
      const { wallet } = request.query;

      if (!wallet || !isValidSolanaAddress(wallet)) {
        return reply.code(400).send({ error: "Invalid wallet address" });
      }

      const nonce = generateNonce();
      const domain =
        process.env.FRONTEND_URL || "http://localhost:3000";
      const message = createSignInMessage(nonce, domain);

      // Store nonce with 5 minute expiry
      nonceStore.set(wallet, {
        nonce,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      return { nonce, message, expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() };
    }
  );

  // POST /auth/verify
  app.post(
    "/verify",
    async (
      request: FastifyRequest<{
        Body: {
          wallet_address: string;
          signature: string;
          nonce: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { wallet_address, signature, nonce } = request.body;

      // Validate inputs
      if (!wallet_address || !isValidSolanaAddress(wallet_address)) {
        return reply.code(400).send({ error: "Invalid wallet address" });
      }

      if (!signature || !nonce) {
        return reply.code(400).send({ error: "Missing signature or nonce" });
      }

      // Check nonce
      const stored = nonceStore.get(wallet_address);
      if (!stored || stored.nonce !== nonce) {
        return reply.code(401).send({ error: "Invalid or expired nonce" });
      }

      if (Date.now() > stored.expiresAt) {
        nonceStore.delete(wallet_address);
        return reply.code(401).send({ error: "Nonce expired" });
      }

      // Verify signature
      try {
        const domain =
          process.env.FRONTEND_URL || "http://localhost:3000";
        const message = createSignInMessage(stored.nonce, domain);
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = Uint8Array.from(
          Buffer.from(signature, "base64")
        );
        const publicKeyBytes = bs58.decode(wallet_address);

        const valid = nacl.sign.detached.verify(
          messageBytes,
          signatureBytes,
          publicKeyBytes
        );

        if (!valid) {
          return reply.code(401).send({ error: "Invalid signature" });
        }
      } catch {
        return reply.code(401).send({ error: "Signature verification failed" });
      }

      // Clean up nonce
      nonceStore.delete(wallet_address);

      // Upsert user in database
      const { error: dbError } = await supabase.from("users").upsert(
        {
          wallet_address,
          subscription_tier: "free",
        },
        { onConflict: "wallet_address" }
      );

      if (dbError) {
        app.log.error(dbError, "Failed to upsert user");
        return reply.code(500).send({ error: "Database error" });
      }

      // Generate JWT
      const token = app.jwt.sign(
        { wallet: wallet_address },
        { expiresIn: "24h" }
      );

      return {
        token,
        user: {
          wallet_address,
          subscription_tier: "free",
          created_at: new Date().toISOString(),
          subscription_expires_at: null,
        },
      };
    }
  );
}
