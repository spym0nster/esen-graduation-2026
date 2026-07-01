import { NextRequest, NextResponse } from "next/server";
import { getStudentById, updateStudent } from "@/lib/rsvpService";
import { sendEmail } from "@/lib/emailService";
import { isAdmin } from "@/lib/adminAuth";
import { buildRSVPEmail } from "@/lib/emailTemplate";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId } = await req.json();
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });

  const student = await getStudentById(studentId);
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    try {
    const entry = {
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      classe: student.classe,
      specialty: student.specialty,
      guestCount: student.guestCount,
    };
    await sendEmail({
      to: student.email,
      subject: "Votre Invitation Officielle – Cérémonie de Remise des Diplômes ESEN 2026",
      html: buildRSVPEmail(entry, studentId, student.guestIds || []),
    });
    student.emailStatus = "Sent";
    await updateStudent(student);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Resend error:", err);
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to resend email", details }, { status: 500 });
  }
}
