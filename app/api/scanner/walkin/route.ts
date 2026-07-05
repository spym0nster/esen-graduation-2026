export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { saveStudent } from "@/lib/rsvpService";
import { appendGuestRows } from "@/lib/googleSheets";
import { isScannerAuthed } from "@/lib/scannerAuth";

// On-the-spot admission for people who never registered (no QR).
// Creates a student already marked checked-in, tagged "Walk-in".
export async function POST(req: Request) {
  if (!(await isScannerAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const firstName = String(body.firstName || "").trim().slice(0, 60);
    const lastName = String(body.lastName || "").trim().slice(0, 60);
    const email = String(body.email || "").trim().slice(0, 120);
    const phone = String(body.phone || "").trim().slice(0, 30);
    const classe = String(body.classe || "").trim().slice(0, 20);
    const specialty = String(body.specialty || "").trim().slice(0, 60);
    const guestCount = Math.max(0, Math.min(3, parseInt(String(body.guestCount ?? "0"), 10) || 0));

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "name_required" }, { status: 400 });
    }

    const studentId = uuidv4();
    const studentQrId = uuidv4();
    const guestIds = Array.from({ length: guestCount }, () => uuidv4());
    const now = new Date().toISOString();

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
      registeredAt: now,
      scanned: true,       // admitted immediately
      scannedAt: now,
      emailStatus: "Walk-in",
      qrId: studentQrId,
    });

    if (guestCount > 0) {
      await appendGuestRows(studentId, `${firstName} ${lastName}`, guestIds, true);
    }

    return NextResponse.json({ success: true, name: `${firstName} ${lastName}`, guestCount });
  } catch (err) {
    console.error("[Walk-in] error:", err);
    return NextResponse.json({ error: "walkin_failed" }, { status: 500 });
  }
}
