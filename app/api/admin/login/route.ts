export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  makeSessionToken,
  verifyPasscode,
  isRateLimited,
  recordFail,
  clearAttempts,
} from "@/lib/adminAuth";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  let passcode: unknown;
  try {
    ({ passcode } = await req.json());
  } catch {
    passcode = undefined;
  }

  if (!verifyPasscode(passcode)) {
    recordFail(ip);
    return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
  }

  clearAttempts(ip);
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, makeSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
