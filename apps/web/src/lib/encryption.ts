/**
 * Encryption Utilities
 * Encrypts/decrypts sensitive data (e.g., integration tokens) at rest.
 * Uses AES-256-GCM with a key from the ENCRYPTION_KEY env var.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const ENCODING = "base64" as const;

/**
 * Get the encryption key from env, validating its format.
 * Returns null if ENCRYPTION_KEY is not configured.
 */
function getKey(): Buffer | null {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) return null;

  // Key should be 64 hex chars (32 bytes)
  if (keyHex.length !== 64 || !/^[0-9a-f]+$/i.test(keyHex)) {
    throw new Error(
      "ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32"
    );
  }

  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypt a plaintext string.
 * Returns a combined base64 string: iv + authTag + ciphertext.
 * If ENCRYPTION_KEY is not set, returns the plaintext (for dev/demo mode).
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  if (!key) {
    // No encryption key — return plaintext wrapped with a marker so we know it's unencrypted
    return `plain:${plaintext}`;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return `enc:${combined.toString(ENCODING)}`;
}

/**
 * Decrypt an encrypted string.
 * Handles both encrypted (`enc:...`) and plaintext (`plain:...`) formats.
 */
export function decrypt(data: string): string {
  if (data.startsWith("plain:")) {
    return data.slice(6);
  }

  if (!data.startsWith("enc:")) {
    // Legacy unencrypted data — return as-is
    return data;
  }

  const key = getKey();
  if (!key) {
    throw new Error("Cannot decrypt: ENCRYPTION_KEY is not set");
  }

  const combined = Buffer.from(data.slice(4), ENCODING);

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Encrypt a JSON-serializable object.
 */
export function encryptJSON<T>(data: T): string {
  return encrypt(JSON.stringify(data));
}

/**
 * Decrypt a JSON-serializable object.
 */
export function decryptJSON<T>(data: string): T {
  return JSON.parse(decrypt(data)) as T;
}
