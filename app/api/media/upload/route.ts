export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { cookies } from "next/headers";
import { addMedia, MediaType } from "@/lib/media";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const type: MediaType = form.get("type") === "gallery" ? "gallery" : "wall";
    const caption = String(form.get("caption") || "").slice(0, 200).trim();
    const author = String(form.get("author") || "").slice(0, 80).trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "no_file" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "not_an_image" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "too_large" }, { status: 413 });
    }

    // The public "Digital Wall" (students) is open. The "Live Gallery"
    // (committee) requires the admin passcode cookie.
    if (type === "gallery") {
      const c = await cookies();
      if (c.get("admin_auth")?.value !== process.env.ADMIN_PASSCODE) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const blob = await put(`${type}/${Date.now()}.${ext}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });

    const item = await addMedia(type, blob.url, caption, author);
    return NextResponse.json({ success: true, item });
  } catch (err) {
    console.error("[Media] upload error:", err);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
