import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { drawPlan } from "../plan-pdf/route";
import { drawProgramme } from "../programme-pdf/route";

export const runtime = "nodejs";

// Two-page A5 flyer: page 1 = seating plan (recto), page 2 = programme (verso).
// Plan is designed in A4 units → scale 148/210 to A5; programme is designed in
// A5 units → scale 1.
export async function GET() {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });

  drawPlan(doc, 148 / 210);
  doc.addPage("a5", "portrait");
  await drawProgramme(doc, 1);

  const buf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Flyer-ESEN-2026-A5.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
