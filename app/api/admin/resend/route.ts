import { NextRequest, NextResponse } from "next/server";
import { getStudentById, updateStudent, getGuestsForStudent } from "@/lib/rsvpService";
import QRCode from "qrcode";
import { sendEmail } from "@/lib/emailService";
import { cookies } from "next/headers";
import { buildRSVPEmail } from "@/lib/emailTemplate";

export const runtime = 'nodejs';

async function isAuthed() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === process.env.ADMIN_PASSCODE;
}

export async function POST(req: NextRequest) {
  if (!await isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    // Generate QR data URLs
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://esen-graduation.vercel.app";
    const studentQrDataUrl = await QRCode.toDataURL(`${BASE_URL}/verify/student/${student.qrId}`);
    // Fetch guest records to obtain QR IDs
    const guests = await getGuestsForStudent(student.guestIds || []);
    const guestQrIds = guests.map(g => g.qrId);
    const guestQrDataUrls = await Promise.all(
      guestQrIds.map(id => QRCode.toDataURL(`${BASE_URL}/verify/guest/${id}`))
    );
    await sendEmail({
      to: student.email,
      subject: "Votre Invitation Officielle – Cérémonie de Remise des Diplômes ESEN 2026",
      html: buildRSVPEmail(entry, studentId, student.qrId, student.guestIds || [], guestQrIds, studentQrDataUrl, guestQrDataUrls),
    });
    student.emailStatus = "Sent";
    await updateStudent(student);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Resend error:", err);
    return NextResponse.json({ error: "Failed to resend email", details: err.message }, { status: 500 });
  }
}
