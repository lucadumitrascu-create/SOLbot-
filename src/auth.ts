import crypto from "crypto";
import { config } from "./config";

export interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

const ALGORITHM = "HS256";
const TOKEN_TTL = 24 * 60 * 60; // 24h in seconds

/**
 * Minimal JWT implementation using Node crypto — zero external dependencies.
 */

function base64url(data: string | Buffer): string {
  const buf = typeof data === "string" ? Buffer.from(data) : data;
  return buf.toString("base64url");
}

function sign(payload: object): string {
  const header = base64url(JSON.stringify({ alg: ALGORITHM, typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", config.jwtSecret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verify(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, sig] = parts;
  const expected = crypto
    .createHmac("sha256", config.jwtSecret)
    .update(`${header}.${body}`)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as TokenPayload;

  if (payload.exp && Date.now() / 1000 > payload.exp) {
    return null;
  }

  return payload;
}

/**
 * Create a signed JWT for a user.
 */
export function createToken(userId: string, email: string): string {
  const now = Math.floor(Date.now() / 1000);
  return sign({
    userId,
    email,
    iat: now,
    exp: now + TOKEN_TTL,
  });
}

/**
 * Verify and decode a JWT. Returns null if invalid or expired.
 */
export function verifyToken(token: string): TokenPayload | null {
  return verify(token);
}
