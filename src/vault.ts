import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_ITERATIONS = 100_000;

/**
 * Derives a 256-bit encryption key from the master password using PBKDF2.
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, KEY_ITERATIONS, 32, "sha512");
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a single base64 string: salt + iv + tag + ciphertext
 * The master key never touches disk — it comes from process.env only.
 */
export function encrypt(plaintext: string, masterKey: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(masterKey, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Pack: salt(32) + iv(16) + tag(16) + ciphertext(N)
  const packed = Buffer.concat([salt, iv, tag, encrypted]);
  return packed.toString("base64");
}

/**
 * Decrypts a base64 packed string back to plaintext.
 * Throws if the master key is wrong or data is tampered.
 */
export function decrypt(packed64: string, masterKey: string): string {
  const packed = Buffer.from(packed64, "base64");

  const salt = packed.subarray(0, SALT_LENGTH);
  const iv = packed.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = packed.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const ciphertext = packed.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = deriveKey(masterKey, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Hash a password for storage (not reversible).
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32);
  const hash = crypto.pbkdf2Sync(password, salt, KEY_ITERATIONS, 64, "sha512");
  return salt.toString("hex") + ":" + hash.toString("hex");
}

/**
 * Verify a password against a stored hash.
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  const salt = Buffer.from(saltHex, "hex");
  const hash = crypto.pbkdf2Sync(password, salt, KEY_ITERATIONS, 64, "sha512");
  return crypto.timingSafeEqual(hash, Buffer.from(hashHex, "hex"));
}

/**
 * Generate a cryptographically random JWT secret.
 */
export function generateSecret(bytes: number = 48): string {
  return crypto.randomBytes(bytes).toString("base64url");
}
