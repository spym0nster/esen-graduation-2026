export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteMedia } from "@/lib/media";

async function isAuthed() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === process.env.ADMIN_PASSCODE;
}

export async function DELETE(req: NextRequest) {
  if (!await isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteMedia(id);
  return NextResponse.json({ success: true });
}
