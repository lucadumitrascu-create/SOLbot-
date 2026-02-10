import fs from "fs";
import path from "path";
import crypto from "crypto";
import { encrypt, decrypt, hashPassword, verifyPassword } from "./vault";
import { config } from "./config";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  /** Private key encrypted with VAULT_MASTER_KEY (AES-256-GCM) */
  encryptedKey: string | null;
  /** Public address (safe to store in plain) */
  publicAddress: string | null;
  createdAt: string;
}

const DATA_DIR = path.resolve(__dirname, "..", "data");
const USERS_FILE = path.join(DATA_DIR, "users.enc.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  }
}

function loadAll(): Record<string, User> {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) return {};
  const raw = fs.readFileSync(USERS_FILE, "utf8");
  return JSON.parse(raw);
}

function saveAll(users: Record<string, User>) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), { mode: 0o600 });
}

/**
 * Register a new user. Returns the created user (without sensitive data).
 */
export function createUser(email: string, password: string): User {
  const users = loadAll();

  const existing = Object.values(users).find((u) => u.email === email);
  if (existing) {
    throw new Error("Email already registered");
  }

  const user: User = {
    id: crypto.randomUUID(),
    email,
    passwordHash: hashPassword(password),
    encryptedKey: null,
    publicAddress: null,
    createdAt: new Date().toISOString(),
  };

  users[user.id] = user;
  saveAll(users);
  return user;
}

/**
 * Authenticate a user by email + password.
 */
export function authenticateUser(email: string, password: string): User | null {
  const users = loadAll();
  const user = Object.values(users).find((u) => u.email === email);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
}

/**
 * Store a user's private key (encrypted at rest with the vault master key).
 */
export function storePrivateKey(
  userId: string,
  privateKeyBase58: string,
  publicAddress: string,
): void {
  const users = loadAll();
  const user = users[userId];
  if (!user) throw new Error("User not found");

  user.encryptedKey = encrypt(privateKeyBase58, config.vaultMasterKey);
  user.publicAddress = publicAddress;
  users[userId] = user;
  saveAll(users);
}

/**
 * Decrypt and return a user's private key (in memory only).
 * Caller is responsible for zeroing it after use.
 */
export function getDecryptedKey(userId: string): string {
  const users = loadAll();
  const user = users[userId];
  if (!user) throw new Error("User not found");
  if (!user.encryptedKey) throw new Error("No private key stored for this user");

  return decrypt(user.encryptedKey, config.vaultMasterKey);
}

/**
 * Get user by ID (without decrypting key).
 */
export function getUser(userId: string): User | null {
  const users = loadAll();
  return users[userId] || null;
}

/**
 * Remove a user's stored key.
 */
export function removePrivateKey(userId: string): void {
  const users = loadAll();
  const user = users[userId];
  if (!user) throw new Error("User not found");
  user.encryptedKey = null;
  user.publicAddress = null;
  users[userId] = user;
  saveAll(users);
}
