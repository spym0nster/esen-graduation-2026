export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import {
  SCANNER_COOKIE,
  makeScannerToken,
  verifyScannerPasscode,
  isScannerRateLimited,
  recordScannerFail,
  clearScannerAttempts,
} from "@/lib/scannerAuth";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (isScannerRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie dans quelques minutes." },
      { status: 429 }
    );
  }

  let passcode: unknown;
  try {
    ({ passcode } = await req.json());
  } catch {
    passcode = undefined;
  }

  if (!verifyScannerPasscode(passcode)) {
    recordScannerFail(ip);
    return NextResponse.json({ error: "Code invalide" }, { status: 401 });
  }

  clearScannerAttempts(ip);
  const res = NextResponse.json({ success: true });
  res.cookies.set(SCANNER_COOKIE, makeScannerToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(SCANNER_COOKIE);
  return res;
}

/** GET returns whether the current visitor is already authed (for the client
 *  to skip the login gate on refresh). */
export async function GET() {
  const { isScannerAuthed } = await import("@/lib/scannerAuth");
  const authed = await isScannerAuthed();
  return NextResponse.json({ authed });
}
