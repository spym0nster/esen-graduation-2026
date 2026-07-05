import { NextRequest, NextResponse } from "next/server";
import { getAllStudents, getAllGuests, deleteStudent, getStudentById } from "@/lib/rsvpService";
import { isAdmin } from "@/lib/adminAuth";
import { logHistory } from "@/lib/history";

export const runtime = 'nodejs';

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [students, guests] = await Promise.all([getAllStudents(), getAllGuests()]);
  return NextResponse.json({ students, guests });
}

export async function DELETE(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId } = await req.json();
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });

  const student = await getStudentById(studentId);
  await deleteStudent(studentId);
  if (student) {
    await logHistory({
      action: "suppression",
      studentId,
      name: `${student.firstName} ${student.lastName}`.trim(),
      details: `${student.classe} · ${student.specialty || "—"} · ${student.email} · ${student.guestCount} invité${student.guestCount === 1 ? "" : "s"}`,
    });
  }
  return NextResponse.json({ success: true });
}
