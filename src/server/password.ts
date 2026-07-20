/**
 * Password hashing with Node's built-in scrypt (OWASP-recommended KDF) — no native
 * dependency, works everywhere including Windows. docs/14 §6 prefers Argon2id; scrypt
 * is a solid, dependency-free stand-in and the format below is upgrade-compatible.
 * Kept free of "server-only" so the seed script can import it too.
 */
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, KEYLEN);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
