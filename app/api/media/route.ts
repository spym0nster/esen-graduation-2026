export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { getMedia, MediaType } from "@/lib/media";

// Public: list media for the wall or gallery. Aggregate content only.
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("type");
  const type: MediaType | undefined = t === "wall" || t === "gallery" ? t : undefined;
  const items = await getMedia(type);
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
