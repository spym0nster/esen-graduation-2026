import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getStudentById, updateStudent, saveGuest, getGuestsForStudent } from "@/lib/rsvpService";
import { sheetDeleteRows } from "@/lib/googleSheets";
import { sendEmail } from "@/lib/emailService";
import { buildRSVPEmail } from "@/lib/emailTemplate";
import { isAdmin } from "@/lib/adminAuth";
import { logHistory } from "@/lib/history";

export const runtime = "nodejs";

// Admin override: the public form caps at 3, but the admin can set 0..10.
const MAX_GUESTS = 10;

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { studentId, resend } = body;
  const target = parseInt(String(body.guestCount), 10);

  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
  if (isNaN(target) || target < 0 || target > MAX_GUESTS) {
    return NextResponse.json({ error: `Nombre invalide (0 à ${MAX_GUESTS}).` }, { status: 400 });
  }

  const student = await getStudentById(studentId);
  if (!student) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const current = student.guestCount || 0;
  if (target === current) return NextResponse.json({ success: true, guestCount: current, unchanged: true });

  const parentName = `${student.firstName} ${student.lastName}`.trim();

  if (target > current) {
    // Mint the extra tickets with correct sequential indices.
    const added: string[] = [];
    for (let i = current + 1; i <= target; i++) {
      const gid = uuidv4();
      await saveGuest({
        id: gid, guestIndex: i, parentId: student.id, parentName,
        classe: "", specialty: "", scanned: false, scannedAt: null, qrId: gid,
      });
      added.push(gid);
    }
    student.guestIds = [...(student.guestIds || []), ...added];
  } else {
    // Remove the LAST (highest-index) tickets; their QR becomes invalid at the door.
    const guests = await getGuestsForStudent(student.guestIds || []);
    guests.sort((a, b) => a.guestIndex - b.guestIndex);
    const victims = guests.slice(guests.length - (current - target));
    const rowIdx = victims.map((g) => g._rowIndex).filter((n): n is number => !!n);
    if (rowIdx.length) await sheetDeleteRows("Guests", rowIdx);
    const victimIds = new Set(victims.map((g) => g.id));
    student.guestIds = (student.guestIds || []).filter((id) => !victimIds.has(id));
  }

  student.guestCount = target;

  let resent = false;
  if (resend && student.email) {
    try {
      await sendEmail({
        to: student.email,
        subject: "Vos billets mis à jour · ESEN Graduation 2026",
        html: buildRSVPEmail(
          {
            firstName: student.firstName, lastName: student.lastName, email: student.email,
            phone: student.phone, classe: student.classe, specialty: student.specialty,
            guestCount: student.guestCount,
          },
          studentId,
          student.guestIds
        ),
      });
      student.emailStatus = "Sent";
      resent = true;
    } catch (err) {
      console.error("[set-guests] resend failed:", err);
    }
  }

  await updateStudent(student);

  await logHistory({
    action: "modification",
    studentId,
    name: parentName,
    details: `accompagnateurs : ${current} → ${target}${resent ? " · tickets renvoyés" : resend && student.email ? " · ÉCHEC renvoi email" : ""}`,
  });

  return NextResponse.json({ success: true, guestCount: target, previous: current, resent });
}
