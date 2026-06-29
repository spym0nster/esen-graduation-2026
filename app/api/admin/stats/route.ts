import { NextResponse } from "next/server";
import { getStats } from "@/lib/rsvpService";
import { cookies } from "next/headers";

async function isAuthed() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === process.env.ADMIN_PASSCODE;
}

export async function GET() {
  if (!await isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await getStats();
  return NextResponse.json(stats);
}
