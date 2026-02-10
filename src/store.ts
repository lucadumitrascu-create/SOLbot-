import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  privateKey: string | null;
  publicAddress: string | null;
  createdAt: string;
}

const DATA_DIR = path.resolve(__dirname, "..", "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  }
}

function loadAll(): Record<string, User> {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) return {};
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveAll(users: Record<string, User>) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), { mode: 0o600 });
}

function hashPw(password: string): string {
  const salt = crypto.randomBytes(32);
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512");
  return salt.toString("hex") + ":" + hash.toString("hex");
}

function verifyPw(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  const salt = Buffer.from(saltHex, "hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512");
  return crypto.timingSafeEqual(hash, Buffer.from(hashHex, "hex"));
}

export function createUser(email: string, password: string): User {
  const users = loadAll();
  if (Object.values(users).find((u) => u.email === email)) {
    throw new Error("Email already registered");
  }
  const user: User = {
    id: crypto.randomUUID(),
    email,
    passwordHash: hashPw(password),
    privateKey: null,
    publicAddress: null,
    createdAt: new Date().toISOString(),
  };
  users[user.id] = user;
  saveAll(users);
  return user;
}

export function authenticateUser(email: string, password: string): User | null {
  const users = loadAll();
  const user = Object.values(users).find((u) => u.email === email);
  if (!user) return null;
  if (!verifyPw(password, user.passwordHash)) return null;
  return user;
}

export function storePrivateKey(userId: string, privateKeyBase58: string, publicAddress: string): void {
  const users = loadAll();
  const user = users[userId];
  if (!user) throw new Error("User not found");
  user.privateKey = privateKeyBase58;
  user.publicAddress = publicAddress;
  users[userId] = user;
  saveAll(users);
}

export function getUserKey(userId: string): string {
  const users = loadAll();
  const user = users[userId];
  if (!user) throw new Error("User not found");
  if (!user.privateKey) throw new Error("No private key stored for this user");
  return user.privateKey;
}

export function getUser(userId: string): User | null {
  const users = loadAll();
  return users[userId] || null;
}

export function ensureLocalUser(supabaseUserId: string, email: string): User {
  const users = loadAll();
  if (users[supabaseUserId]) return users[supabaseUserId];
  const user: User = {
    id: supabaseUserId,
    email,
    passwordHash: "",
    privateKey: null,
    publicAddress: null,
    createdAt: new Date().toISOString(),
  };
  users[user.id] = user;
  saveAll(users);
  return user;
}

export function removePrivateKey(userId: string): void {
  const users = loadAll();
  const user = users[userId];
  if (!user) throw new Error("User not found");
  user.privateKey = null;
  user.publicAddress = null;
  users[userId] = user;
  saveAll(users);
}
