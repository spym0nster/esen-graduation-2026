import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { getHistory } from "@/lib/history";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const entries = await getHistory(500);
  return NextResponse.json({ entries });
}
