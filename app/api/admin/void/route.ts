import { NextRequest, NextResponse } from "next/server";
import { voidStudent } from "@/lib/rsvpService";
import { isAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, reason } = await req.json();
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });

  try {
    const out = await voidStudent(studentId, String(reason || "").trim() || "Annulé");
    return NextResponse.json({ success: true, voided: out.voided });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Annulation échouée", details }, { status: 500 });
  }
}
