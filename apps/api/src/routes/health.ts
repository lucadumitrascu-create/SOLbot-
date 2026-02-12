import type { FastifyInstance } from "fastify";
import { supabase } from "../services/supabase.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    const { error } = await supabase.from("users").select("count").limit(0);

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        api: "healthy",
        database: error ? "unhealthy" : "healthy",
      },
    };
  });
}
