import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getStudentById, updateStudent, saveGuest } from "@/lib/rsvpService";
import { sendEmail } from "@/lib/emailService";
import { buildRSVPEmail } from "@/lib/emailTemplate";
import { isAdmin } from "@/lib/adminAuth";
import { logHistory } from "@/lib/history";

export const runtime = "nodejs";

const MAX_GUESTS = 3;

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, resend } = await req.json();
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });

  const student = await getStudentById(studentId);
  if (!student) return NextResponse.json({ error: "Étudiant introuvable" }, { status: 404 });

  if ((student.guestCount || 0) >= MAX_GUESTS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_GUESTS} accompagnateurs déjà atteint.` },
      { status: 400 }
    );
  }

  const newGuestId = uuidv4();
  const guestIndex = (student.guestCount || 0) + 1;
  const parentName = `${student.firstName} ${student.lastName}`.trim();

  // Guest row first, then the student pointer — if the second write fails the
  // orphan guest row is harmless (not referenced by guestIds).
  await saveGuest({
    id: newGuestId,
    guestIndex,
    parentId: student.id,
    parentName,
    classe: "",
    specialty: "",
    scanned: false,
    scannedAt: null,
    qrId: newGuestId,
  });

  student.guestCount = guestIndex;
  student.guestIds = [...(student.guestIds || []), newGuestId];

  let resent = false;
  if (resend) {
    try {
      await sendEmail({
        to: student.email,
        subject: "Vos billets mis à jour — accompagnateur ajouté · ESEN Graduation 2026",
        html: buildRSVPEmail(
          {
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            phone: student.phone,
            classe: student.classe,
            specialty: student.specialty,
            guestCount: student.guestCount,
          },
          studentId,
          student.guestIds
        ),
      });
      student.emailStatus = "Sent";
      resent = true;
    } catch (err) {
      console.error("[add-guest] resend failed:", err);
      // continue: the guest is added either way
    }
  }

  await updateStudent(student);

  await logHistory({
    action: "modification",
    studentId,
    name: parentName,
    details: `ajout d'un ${guestIndex}e accompagnateur${resent ? " · tickets renvoyés" : resend ? " · ÉCHEC renvoi email" : ""}`,
  });

  return NextResponse.json({ success: true, guestCount: student.guestCount, guestId: newGuestId, resent });
}
