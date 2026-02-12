import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { authRoutes } from "./routes/auth.js";
import { walletsRoutes } from "./routes/wallets.js";
import { healthRoutes } from "./routes/health.js";

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";

async function main() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
    },
  });

  // --- Plugins ---
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "change-me-in-production",
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // --- Auth decorator ---
  app.decorate(
    "authenticate",
    async function (request: { jwtVerify: () => Promise<void> }) {
      await request.jwtVerify();
    }
  );

  // --- Routes ---
  await app.register(healthRoutes, { prefix: "/health" });
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(walletsRoutes, { prefix: "/wallets" });

  // --- Start ---
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`SOLbot API running on ${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
