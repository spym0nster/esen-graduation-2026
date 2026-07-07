import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { programmeItems } from "@/data/programme";

export const runtime = "nodejs";

const GOLD: [number, number, number] = [240, 180, 41];
const WHITE: [number, number, number] = [255, 255, 255];
const MUTED: [number, number, number] = [170, 180, 205];

// Ceremony-styled programme, designed in A5 mm (148 x 210) — the flyer verso
// of the seating plan. ?size=a4 scales the same layout up by 210/148.
export async function GET(req: NextRequest) {
  const size = new URL(req.url).searchParams.get("size") === "a4" ? "a4" : "a5";
  const k = size === "a4" ? 210 / 148 : 1;
  const s = (v: number) => v * k;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: size });

  // jsPDF's align:"center" ignores charSpace — center manually.
  const centerSpaced = (text: string, cx: number, y: number, cs: number) => {
    const w = doc.getTextWidth(text) + cs * (text.length - 1);
    doc.text(text, cx - w / 2, y, { charSpace: cs });
  };

  // Background — vertical gradient bands: #0A1A4A → #0F2560 → #1C0F06
  const stops: Array<[number, [number, number, number]]> = [
    [0, [10, 26, 74]], [0.55, [15, 37, 96]], [1, [28, 15, 6]],
  ];
  const lerp = (t: number): [number, number, number] => {
    const [a, b] = t <= stops[1][0] ? [stops[0], stops[1]] : [stops[1], stops[2]];
    const f = (t - a[0]) / (b[0] - a[0] || 1);
    return [
      Math.round(a[1][0] + (b[1][0] - a[1][0]) * f),
      Math.round(a[1][1] + (b[1][1] - a[1][1]) * f),
      Math.round(a[1][2] + (b[1][2] - a[1][2]) * f),
    ];
  };
  const BANDS = 60;
  for (let i = 0; i < BANDS; i++) {
    doc.setFillColor(...lerp(i / (BANDS - 1)));
    doc.rect(0, s((210 / BANDS) * i), s(148), s(210 / BANDS + 0.3), "F");
  }

  // Gold inset frame
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(s(0.45));
  doc.roundedRect(s(4.5), s(4.5), s(139), s(201), s(3), s(3), "S");

  // Header
  doc.setTextColor(...WHITE);
  doc.setFont("times", "bold");
  doc.setFontSize(s(25));
  centerSpaced("ESEN", s(74), s(23), s(2.5));
  doc.setTextColor(...GOLD);
  doc.setFont("times", "normal");
  doc.setFontSize(s(8.5));
  centerSpaced("GRADUATION CEREMONY 2026", s(74), s(30), s(1.6));
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(s(0.4));
  doc.line(s(56), s(34.5), s(92), s(34.5));

  doc.setTextColor(...WHITE);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(s(16.5));
  doc.text("Programme de la Cérémonie", s(74), s(45), { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(s(8));
  doc.setTextColor(...MUTED);
  doc.text("Jeudi 9 juillet 2026  ·  UTICA", s(74), s(51.5), { align: "center" });

  // Timeline — dynamic pitch: long titles wrap onto a second line.
  const START_Y = 60, BASE_PITCH = 9.6, WRAP_EXTRA = 3.6, LINE_X = 31;
  const TITLE_MAX_W = 103; // mm available for the title column (design units)

  // Pre-measure so the connecting line matches the real height.
  const items = programmeItems.map((item) => {
    doc.setFont("helvetica", item.highlight ? "bold" : "normal");
    doc.setFontSize(s(item.highlight ? 9.8 : 9.2));
    const lines: string[] = doc.splitTextToSize(item.titleFr, s(TITLE_MAX_W));
    return { ...item, lines };
  });
  const totalH = items.reduce((h, it) => h + BASE_PITCH + (it.lines.length - 1) * WRAP_EXTRA, 0);
  const lastY = START_Y + totalH - BASE_PITCH;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(s(0.35));
  doc.line(s(LINE_X), s(START_Y - 4), s(LINE_X), s(lastY + 4));

  let y = START_Y;
  items.forEach((item) => {
    // Dot — highlights get a bigger solid gold dot
    if (item.highlight) {
      doc.setFillColor(...GOLD);
      doc.circle(s(LINE_X), s(y - 1), s(1.9), "F");
      doc.setFillColor(15, 37, 96);
      doc.circle(s(LINE_X), s(y - 1), s(0.7), "F");
    } else {
      doc.setFillColor(15, 37, 96);
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(s(0.4));
      doc.circle(s(LINE_X), s(y - 1), s(1.3), "FD");
    }

    // Time — gold, right-aligned before the line
    doc.setFont("helvetica", "bold");
    doc.setFontSize(s(9.5));
    doc.setTextColor(...GOLD);
    doc.text(item.time.replace(":", "h"), s(LINE_X - 5), s(y), { align: "right" });

    // Title — gold for highlights, white otherwise; wrapped lines
    doc.setFont("helvetica", item.highlight ? "bold" : "normal");
    doc.setFontSize(s(item.highlight ? 9.8 : 9.2));
    doc.setTextColor(...(item.highlight ? GOLD : WHITE));
    item.lines.forEach((ln, li) => doc.text(ln, s(LINE_X + 6), s(y + li * WRAP_EXTRA)));

    y += BASE_PITCH + (item.lines.length - 1) * WRAP_EXTRA;
  });

  // Footer — Ambassadors logo in a white disc + recto pointer.
  // Kept clear of the gold frame (frame bottom edge is at y = 205.5).
  const footTop = Math.min(Math.max(lastY + 8, 183), 186);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(s(0.4));
  doc.line(s(56), s(footTop), s(92), s(footTop));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(s(7.2));
  doc.setTextColor(...MUTED);
  doc.text("Présentez votre billet QR à l'entrée · Plan de la salle au recto", s(74), s(footTop + 4.5), { align: "center" });

  try {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://esen-graduation-2026.vercel.app";
    const res = await fetch(`${BASE_URL}/images/logos/ambassadors.png`);
    if (res.ok) {
      const logo = `data:image/png;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
      const cy = footTop + 12; // disc bottom = footTop + 17 ≤ 203 → safely inside frame
      doc.setFillColor(255, 255, 255);
      doc.circle(s(74), s(cy), s(5), "F");
      doc.addImage(logo, "PNG", s(74 - 4.1), s(cy - 4.1), s(8.2), s(8.2));
    } else {
      throw new Error("logo fetch failed");
    }
  } catch {
    doc.setTextColor(...GOLD);
    doc.setFontSize(s(7));
    centerSpaced("ESEN AMBASSADORS", s(74), s(footTop + 11), s(1.2));
  }

  const buf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Programme-ESEN-2026-${size.toUpperCase()}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
