import { NextRequest, NextResponse } from "next/server";
import { getAllStudents, getAllGuests, deleteStudent } from "@/lib/rsvpService";
import { isAdmin } from "@/lib/adminAuth";

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

  await deleteStudent(studentId);
  return NextResponse.json({ success: true });
}
