import { NextRequest, NextResponse } from "next/server";
import { voidStudent, getStudentById } from "@/lib/rsvpService";
import { isAdmin } from "@/lib/adminAuth";
import { logHistory } from "@/lib/history";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, reason } = await req.json();
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });

  try {
    const student = await getStudentById(studentId);
    const cleanReason = String(reason || "").trim() || "Annulé";
    const out = await voidStudent(studentId, cleanReason);
    if (student && out.voided > 0) {
      await logHistory({
        action: "annulation",
        studentId,
        name: `${student.firstName} ${student.lastName}`.trim(),
        details: `${out.voided} ticket${out.voided === 1 ? "" : "s"} annulé${out.voided === 1 ? "" : "s"} · motif: ${cleanReason}`,
      });
    }
    return NextResponse.json({ success: true, voided: out.voided });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Annulation échouée", details }, { status: 500 });
  }
}
