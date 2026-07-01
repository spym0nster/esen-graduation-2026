import { NextResponse } from "next/server";
import { getStats } from "@/lib/rsvpService";
import { isAdmin } from "@/lib/adminAuth";

export const runtime = 'nodejs';

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await getStats();
  return NextResponse.json(stats);
}
