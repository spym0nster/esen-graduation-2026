import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { saveStudent } from "@/lib/rsvpService";
import { isAdmin } from "@/lib/adminAuth";
import { logHistory } from "@/lib/history";

export const runtime = "nodejs";

// Creates a "special invitation" attendee. Stored as a Students row with
// classe = "VIP" so the scanner, dashboards, void and history all work
// without any extra plumbing. qrId === id so both the admin QR modal and
// the printed ticket resolve at the door.
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name || "").trim().slice(0, 80);
  const title = String(body.title || "").trim().slice(0, 80);

  if (name.length < 2) {
    return NextResponse.json({ error: "Nom requis (min 2 caractères)" }, { status: 400 });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  await saveStudent({
    id,
    firstName: name,
    lastName: "",
    email: "",
    phone: "",
    classe: "VIP",
    specialty: title,
    guestCount: 0,
    guestIds: [],
    registeredAt: now,
    scanned: false,
    scannedAt: null,
    emailStatus: "VIP",
    qrId: id,
  });

  await logHistory({
    action: "invitation",
    studentId: id,
    name,
    details: `invitation spéciale créée${title ? ` · ${title}` : ""}`,
  });

  return NextResponse.json({ success: true, id, name, title });
}
