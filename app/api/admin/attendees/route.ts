import { NextRequest, NextResponse } from "next/server";
import { getAllStudents, deleteStudent } from "@/lib/rsvpService";
import { cookies } from "next/headers";

export const runtime = 'nodejs';

async function isAuthed() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === process.env.ADMIN_PASSCODE;
}

export async function GET() {
  if (!await isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const students = await getAllStudents();
  return NextResponse.json({ students });
}

export async function DELETE(req: NextRequest) {
  if (!await isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId } = await req.json();
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });

  await deleteStudent(studentId);
  return NextResponse.json({ success: true });
}
