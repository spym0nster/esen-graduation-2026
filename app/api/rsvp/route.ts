import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { validateRSVP, RSVPEntry } from "@/lib/rsvp";
import { buildRSVPEmail } from "@/lib/emailTemplate";
import { sendEmail } from "@/lib/emailService";
import { findDuplicateStudent, saveStudent } from "@/lib/rsvpService";
import { generateTicketPDF } from "@/lib/pdfGenerator";
import { appendGuestRows } from "@/lib/googleSheets";

export const runtime = 'nodejs';

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

    // 2. Check duplicate (email OR phone OR full name already registered)
    const existing = await findDuplicateStudent(email, phone);
    if (existing) {
      return NextResponse.json({ error: "already_registered" }, { status: 409 });
    }

    // 3. Generate IDs
    const studentId = uuidv4();
    const studentQrId = uuidv4();
    const guestIds = Array.from({ length: guestCount }, () => uuidv4());
    const guestQrIds = guestIds;
    const registeredAt = new Date().toISOString();

    // 4. Build the ticket PDF (kept in memory only — nothing is persisted yet)
    const pdfBuffer = await generateTicketPDF(
      { firstName, lastName, classe, specialty, qrId: studentQrId },
      guestQrIds.map((qrId, i) => ({ qrId, guestIndex: i + 1 }))
    );

    // 5. Try to DELIVER first, so we verify the address before creating anything.
    let emailStatus: "Sent" | "Failed" = "Failed";
    let smtpRejected = false; // SMTP explicitly refused the recipient (address not found)
    try {
      const info = (await sendEmail({
        to: email,
        subject: "Votre Invitation Officielle – Cérémonie de Remise des Diplômes ESEN 2026",
        html: buildRSVPEmail(
          { firstName, lastName, email, phone, classe, specialty, guestCount },
          studentId,
          guestIds
        ),
        attachments: [
          {
            filename: `ESEN_Graduation_Tickets_${firstName}_${lastName}.pdf`,
            content: pdfBuffer,
          },
        ],
      })) as { accepted?: unknown[]; rejected?: unknown[] };

      const accepted = Array.isArray(info?.accepted) ? info.accepted.length : 0;
      const rejected = Array.isArray(info?.rejected) ? info.rejected.length : 0;
      smtpRejected = rejected > 0; // definitive refusal for this address
      emailStatus = accepted > 0 && rejected === 0 ? "Sent" : "Failed";
    } catch (emailErr) {
      // Transient/connection error — NOT a definitive "address not found".
      // Keep the registration so a valid attendee is never lost (resend later).
      console.error("Email send error (kept, status Failed) for", email, ":", emailErr);
      emailStatus = "Failed";
      smtpRejected = false;
    }

    // 6. Address explicitly undeliverable → do NOT create the ticket / row.
    if (smtpRejected) {
      console.error("Undeliverable address — registration NOT created:", email);
      return NextResponse.json({ error: "email_undeliverable" }, { status: 422 });
    }

    // 7. Deliverable (or transient error) → create the registration exactly once.
    await saveStudent({
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
      emailStatus,
      qrId: studentQrId,
    });

    if (guestCount > 0) {
      await appendGuestRows(studentId, `${firstName} ${lastName}`, guestIds);
    }

    return NextResponse.json({ success: true, studentId, guestCount, emailStatus });
  } catch (error) {
    console.error("RSVP Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
