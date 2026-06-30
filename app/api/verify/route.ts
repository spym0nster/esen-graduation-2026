import { NextRequest, NextResponse } from "next/server";
import { getStudentByQrId, getGuestByQrId, updateStudent, updateGuest } from "@/lib/rsvpService";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ status: "invalid" }, { status: 400 });

    // Token may be a full URL — extract the path ID
    let id = token;
    try {
      const url = new URL(token);
      const parts = url.pathname.split("/").filter(Boolean);
      // /verify/guest/<id> or /verify/<id>
      if (parts.includes("guest")) {
        const guestIdx = parts.indexOf("guest");
        id = parts[guestIdx + 1];
        return await handleGuest(id);
      } else {
        id = parts[parts.length - 1];
        return await handleStudent(id);
      }
    } catch {
      // Not a URL, treat as raw QR ID — try student first, then guest
      const student = await getStudentByQrId(token);
      if (student) return await handleStudent(token);
      const guest = await getGuestByQrId(token);
      if (guest) return await handleGuest(token);
      return NextResponse.json({ status: "invalid" });
    }
  } catch (err) {
    console.error("Verify error:", err);
    return NextResponse.json({ status: "invalid" }, { status: 500 });
  }
}

async function handleStudent(id: string): Promise<NextResponse> {
  const student = await getStudentByQrId(id);
  if (!student) return NextResponse.json({ status: "invalid" });

  if (student.scanned) {
    return NextResponse.json({
      status: "already_scanned",
      type: "student",
      name: `${student.firstName} ${student.lastName}`,
      classe: student.classe,
      specialty: student.specialty,
      scannedAt: student.scannedAt,
    });
  }

  const scannedAt = new Date().toISOString();
  student.scanned = true;
  student.scannedAt = scannedAt;
  await updateStudent(student);

  return NextResponse.json({
    status: "authorized",
    type: "student",
    name: `${student.firstName} ${student.lastName}`,
    classe: student.classe,
    specialty: student.specialty,
    scannedAt,
  });
}

async function handleGuest(id: string): Promise<NextResponse> {
  const guest = await getGuestByQrId(id);
  if (!guest) return NextResponse.json({ status: "invalid" });

  if (guest.scanned) {
    return NextResponse.json({
      status: "already_scanned",
      type: `Guest #${guest.guestIndex}`,
      name: `Guest of ${guest.parentName}`,
      classe: guest.classe,
      specialty: guest.specialty,
      scannedAt: guest.scannedAt,
    });
  }

  const scannedAt = new Date().toISOString();
  guest.scanned = true;
  guest.scannedAt = scannedAt;
  await updateGuest(guest);

  return NextResponse.json({
    status: "authorized",
    type: `Guest #${guest.guestIndex}`,
    name: `Guest of ${guest.parentName}`,
    classe: guest.classe,
    specialty: guest.specialty,
    scannedAt,
  });
}
