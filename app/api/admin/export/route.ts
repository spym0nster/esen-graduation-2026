import { NextRequest, NextResponse } from "next/server";
import { getAllStudents } from "@/lib/rsvpService";
import * as XLSX from "xlsx";
import { cookies } from "next/headers";

export const runtime = 'nodejs';

async function isAuthed() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === process.env.ADMIN_PASSCODE;
}

export async function GET(req: NextRequest) {
  if (!await isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "csv";

  const students = await getAllStudents();

  const rows = students.map((s) => ({
    "First Name": s.firstName,
    "Last Name": s.lastName,
    Email: s.email,
    Phone: s.phone,
    Class: s.classe,
    Major: s.specialty,
    Guests: s.guestCount,
    "Registered At": new Date(s.registeredAt).toLocaleString("fr-TN"),
    "Student Checked In": s.scanned ? "Yes" : "No",
    "Student Checked In At": s.scannedAt ? new Date(s.scannedAt).toLocaleString("fr-TN") : "",
    "Email Status": s.emailStatus || "Pending",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Registrations");

  if (format === "xlsx") {
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="esen-rsvp-${Date.now()}.xlsx"`,
      },
    });
  }

  const csv = XLSX.utils.sheet_to_csv(ws);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="esen-rsvp-${Date.now()}.csv"`,
    },
  });
}
