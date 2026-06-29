import { NextRequest, NextResponse } from "next/server";
import { getStudentById } from "@/lib/rsvpService";
import QRCode from "qrcode";
import { cookies } from "next/headers";

async function isAuthed() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === process.env.ADMIN_PASSCODE;
}

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://esen-graduation.vercel.app";

export async function GET(req: NextRequest) {
  if (!await isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });

  const student = await getStudentById(studentId);
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const studentQR = await QRCode.toDataURL(`${BASE}/verify/${studentId}`, {
    width: 280,
    margin: 2,
    color: { dark: "#0F2560", light: "#FFFFFF" },
  });

  const guestQRs = await Promise.all(
    (student.guestIds || []).map((id) =>
      QRCode.toDataURL(`${BASE}/verify/guest/${id}`, {
        width: 280,
        margin: 2,
        color: { dark: "#1B3A8C", light: "#FFFFFF" },
      })
    )
  );

  return NextResponse.json({ studentQR, guestQRs });
}
