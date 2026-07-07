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
  doc.text("ESEN", s(74), s(23), { align: "center", charSpace: s(2.5) });
  doc.setTextColor(...GOLD);
  doc.setFont("times", "normal");
  doc.setFontSize(s(8.5));
  doc.text("GRADUATION CEREMONY 2026", s(74), s(30), { align: "center", charSpace: s(1.6) });
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

  // Timeline
  const START_Y = 63, PITCH = 10.8, LINE_X = 31;
  const lastY = START_Y + (programmeItems.length - 1) * PITCH;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(s(0.35));
  doc.line(s(LINE_X), s(START_Y - 4), s(LINE_X), s(lastY + 4));

  programmeItems.forEach((item, i) => {
    const y = START_Y + i * PITCH;

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
    doc.text(item.time, s(LINE_X - 5), s(y), { align: "right" });

    // Title — gold for highlights, white otherwise
    doc.setFont("helvetica", item.highlight ? "bold" : "normal");
    doc.setFontSize(s(item.highlight ? 10 : 9.3));
    doc.setTextColor(...(item.highlight ? GOLD : WHITE));
    doc.text(item.titleFr, s(LINE_X + 6), s(y));
  });

  // Footer
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(s(0.4));
  doc.line(s(56), s(191), s(92), s(191));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(s(7.2));
  doc.setTextColor(...MUTED);
  doc.text("Présentez votre billet QR à l'entrée · Plan de la salle au recto", s(74), s(196.5), { align: "center" });
  doc.setTextColor(...GOLD);
  doc.setFontSize(s(7));
  doc.text("ESEN AMBASSADORS", s(74), s(201.5), { align: "center", charSpace: s(1.2) });

  const buf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Programme-ESEN-2026-${size.toUpperCase()}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
