import crypto from "crypto";
import { cookies } from "next/headers";
import { isAdmin } from "./adminAuth";

export const SCANNER_COOKIE = "scanner_auth";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours — one long shift

function secret(): string {
  return (
    process.env.SCANNER_SESSION_SECRET ||
    process.env.SCANNER_PASSCODE ||
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

/** Accepts the scanner passcode. If SCANNER_PASSCODE isn't set, falls back
 *  to ADMIN_PASSCODE so the scanner still works out-of-the-box for admins. */
export function verifyScannerPasscode(input: unknown): boolean {
  const scannerPass = process.env.SCANNER_PASSCODE || "";
  const adminPass = process.env.ADMIN_PASSCODE || "";
  if (typeof input !== "string" || !input) return false;
  if (scannerPass && safeEqual(input, scannerPass)) return true;
  if (adminPass && safeEqual(input, adminPass)) return true;
  return false;
}

export function makeScannerToken(): string {
  const exp = String(Date.now() + TTL_MS);
  return `${exp}.${hmac(exp)}`;
}

export function verifyScannerToken(token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(exp)) return false;
  if (Number(exp) < Date.now()) return false;
  return safeEqual(sig, hmac(exp));
}

/** True if the current request carries a valid scanner OR admin session cookie. */
export async function isScannerAuthed(): Promise<boolean> {
  const store = await cookies();
  if (verifyScannerToken(store.get(SCANNER_COOKIE)?.value)) return true;
  // Admins can scan without a separate login.
  return await isAdmin();
}

// Best-effort per-instance rate limit (mirror of adminAuth).
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();
export function isScannerRateLimited(ip: string): boolean {
  const e = attempts.get(ip);
  if (!e || Date.now() > e.resetAt) return false;
  return e.count >= MAX_FAILS;
}
export function recordScannerFail(ip: string): void {
  const now = Date.now();
  const e = attempts.get(ip);
  if (!e || now > e.resetAt) attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  else e.count++;
}
export function clearScannerAttempts(ip: string): void {
  attempts.delete(ip);
}
