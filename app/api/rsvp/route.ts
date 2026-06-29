import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { validateRSVP, RSVPEntry } from "@/lib/rsvp";
import { buildRSVPEmail } from "@/lib/emailTemplate";
import { sendEmail } from "@/lib/emailService";
import { getStudentByEmail, saveStudent, saveGuest, updateStudent } from "@/lib/rsvpService";
import { generateTicketPDF } from "@/lib/pdfGenerator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate
    const validation = validateRSVP(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "validation", fields: validation.errors },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, classe, specialty, guestCount } = body as RSVPEntry;

    // 2. Check duplicate
    const existing = await getStudentByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "already_registered" }, { status: 409 });
    }

    // 3. Generate IDs
    const studentId = uuidv4();
    const studentQrId = uuidv4();
    const guestIds = Array.from({ length: guestCount }, () => uuidv4());
    const guestQrIds = Array.from({ length: guestCount }, () => uuidv4());
    const registeredAt = new Date().toISOString();

    // 4. Save to Google Sheets
    const studentRecord = {
      id: studentId,
      firstName,
      lastName,
      email,
      phone,
      classe,
      specialty,
      guestCount,
      guestIds,
      registeredAt,
      scanned: false,
      scannedAt: null,
      emailStatus: "Pending" as const,
      qrId: studentQrId,
    };

    await saveStudent(studentRecord);

    for (let i = 0; i < guestIds.length; i++) {
      await saveGuest({
        id: guestIds[i],
        guestIndex: i + 1,
        parentId: studentId,
        parentName: `${firstName} ${lastName}`,
        classe,
        specialty,
        scanned: false,
        scannedAt: null,
        qrId: guestQrIds[i],
      });
    }

    // 5. Generate QR codes for email
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://esen-graduation.vercel.app";
    
    const studentQrDataUrl = await QRCode.toDataURL(
      `${BASE_URL}/verify/student/${studentQrId}`,
      { width: 300, margin: 2, color: { dark: "#0F2560", light: "#FFFFFF" } }
    );

    const guestQrDataUrls = await Promise.all(
      guestQrIds.map((qrId) =>
        QRCode.toDataURL(`${BASE_URL}/verify/guest/${qrId}`, {
          width: 300,
          margin: 2,
          color: { dark: "#1B3A8C", light: "#FFFFFF" },
        })
      )
    );

    // 6. Generate PDF
    const pdfBuffer = await generateTicketPDF(
      { firstName, lastName, classe, specialty, qrId: studentQrId },
      guestQrIds.map((qrId, i) => ({ qrId, guestIndex: i + 1 }))
    );

    // 7. Send email with QR codes and PDF attachment
    let emailStatus = "Pending";
    try {
      await sendEmail({
        to: email,
        subject: "Votre Invitation Officielle – Cérémonie de Remise des Diplômes ESEN 2026",
        html: buildRSVPEmail(
          { firstName, lastName, email, phone, classe, specialty, guestCount },
          studentId,
          studentQrId,
          guestIds,
          guestQrIds,
          studentQrDataUrl,
          guestQrDataUrls
        ),
        attachments: [
          {
            filename: `ESEN_Graduation_Tickets_${firstName}_${lastName}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
      emailStatus = "Sent";

      const savedStudent = await getStudentByEmail(email);
      if (savedStudent) {
        savedStudent.emailStatus = "Sent";
        await updateStudent(savedStudent);
      }
    } catch (emailErr) {
      console.error("Failed to send email to", email, ":", emailErr);
    }

    return NextResponse.json({ success: true, studentId, guestCount, emailStatus });
  } catch (error) {
    console.error("RSVP Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
