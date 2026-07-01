import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_auth";
const TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// Signing key: a dedicated secret if provided, else derived from the passcode.
// Changing either invalidates existing sessions (acceptable).
function secret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSCODE ||
    "esen-fallback-secret"
  );
}

function hmac(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Constant-time passcode check (avoids timing leaks). */
export function verifyPasscode(input: unknown): boolean {
  const expected = process.env.ADMIN_PASSCODE || "";
  if (!expected || typeof input !== "string" || !input) return false;
  return safeEqual(input, expected);
}

/** Opaque signed session token: "<exp>.<hmac(exp)>". Contains no secret. */
export function makeSessionToken(): string {
  const exp = String(Date.now() + TTL_MS);
  return `${exp}.${hmac(exp)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(exp)) return false;
  if (Number(exp) < Date.now()) return false; // expired
  return safeEqual(sig, hmac(exp));
}

/** True if the current request carries a valid admin session cookie. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

// ── Best-effort login rate limiting (per server instance) ───────────────────
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(ip: string): boolean {
  const e = attempts.get(ip);
  if (!e || Date.now() > e.resetAt) return false;
  return e.count >= MAX_FAILS;
}
export function recordFail(ip: string): void {
  const now = Date.now();
  const e = attempts.get(ip);
  if (!e || now > e.resetAt) attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  else e.count++;
}
export function clearAttempts(ip: string): void {
  attempts.delete(ip);
}
