import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { seatingGrid, LEFT_COLS, ZoneKey } from "@/data/seating";

export const runtime = "nodejs";

const PRINT: Record<ZoneKey, { fill: string; text: string; label: string; where: string }> = {
  BIS:   { fill: "#1B3A8C", text: "#FFFFFF", label: "Business Information System", where: "Diplomes - bloc 1" },
  BI:    { fill: "#0F2560", text: "#FFFFFF", label: "Business Intelligence",       where: "Diplomes - bloc 2" },
  EB:    { fill: "#0091B5", text: "#FFFFFF", label: "E-Business",                  where: "Diplomes - bloc 3" },
  M2:    { fill: "#0074B0", text: "#FFFFFF", label: "Master 2",                    where: "Diplomes - bloc 4" },
  MDS:   { fill: "#F0B429", text: "#3A2A00", label: "E-Marketing & Digital Strat.", where: "Diplomes - rangee 19" },
  ESEN:  { fill: "#3E67C0", text: "#FFFFFF", label: "ESEN General",                where: "Diplomes - fond de salle" },
  Laur:  { fill: "#C79A16", text: "#3A2A00", label: "Laureats",                    where: "Diplomes - rangees 17-18" },
  Admin: { fill: "#9B6FBF", text: "#FFFFFF", label: "Professeurs / Administration", where: "Avant gauche (3 rangs)" },
  Invite:{ fill: "#BDB086", text: "#33301F", label: "Invites",                     where: "Cote gauche" },
  EMPTY: { fill: "#FFFFFF", text: "#FFFFFF", label: "", where: "" },
};

const LEGEND: ZoneKey[] = ["Admin", "Invite", "BIS", "BI", "EB", "M2", "Laur", "MDS", "ESEN"];
const seatLabel = (z: ZoneKey) => (z !== "Admin" && z !== "Invite" && z !== "EMPTY" ? z : "");
const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

// Layout designed in A4 mm (210 x 297). A5 shares the exact aspect ratio, so
// ?size=a5 renders the same drawing uniformly scaled by 148/210.
export async function GET(req: NextRequest) {
  const size = new URL(req.url).searchParams.get("size") === "a5" ? "a5" : "a4";
  const k = size === "a5" ? 148 / 210 : 1;
  const s = (v: number) => v * k;

  // Geometry (A4 mm, all scaled through s())
  const SEAT = 5.75, GX = 0.4, GY = 0.4, AISLE = 5;
  const LEFTW = LEFT_COLS * SEAT + (LEFT_COLS - 1) * GX;
  const RIGHTW = 16 * SEAT + 15 * GX;
  const GRIDW = LEFTW + AISLE + RIGHTW;
  const STARTX = (210 - GRIDW) / 2;
  const RIGHTX = STARTX + LEFTW + AISLE;
  const GRID_TOP = 57;
  const ROW_PITCH = SEAT + GY;
  const GRID_H = (seatingGrid.length - 1) * ROW_PITCH + SEAT;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: size });
  doc.setFont("helvetica", "normal");

  // Header
  doc.setTextColor(...rgb("#B8901A"));
  doc.setFontSize(s(8));
  doc.text("ESEN  -  GRADUATION 2026", s(105), s(16), { align: "center", charSpace: s(1) });
  doc.setTextColor(...rgb("#0F2560"));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(s(22));
  doc.text("Plan de la salle", s(105), s(26), { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.setFontSize(s(10));
  doc.text("Ceremonie de remise des diplomes  -  9 juillet 2026  -  UTICA", s(105), s(33), { align: "center" });
  doc.setDrawColor(...rgb("#F0B429"));
  doc.setLineWidth(s(0.8));
  doc.line(s(60), s(37), s(150), s(37));

  // Stage
  doc.setFillColor(...rgb("#0F2560"));
  doc.roundedRect(s(75), s(42), s(60), s(9), s(4.5), s(4.5), "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(s(11));
  doc.text("SCENE", s(105), s(48.2), { align: "center", charSpace: s(2) });

  // Column headers
  doc.setFontSize(s(8));
  doc.setTextColor(50, 50, 50);
  doc.text("PROFS - ADMIN / INVITES", s(STARTX + LEFTW / 2), s(56), { align: "center", charSpace: s(0.4) });
  doc.setTextColor(...rgb("#B8901A"));
  doc.text("DIPLOMES", s(RIGHTX + RIGHTW / 2), s(56), { align: "center", charSpace: s(0.6) });

  // Aisle dashed line
  doc.setDrawColor(196, 196, 196);
  doc.setLineWidth(s(0.3));
  doc.setLineDashPattern([s(1), s(1)], 0);
  doc.line(s(STARTX + LEFTW + AISLE / 2), s(GRID_TOP), s(STARTX + LEFTW + AISLE / 2), s(GRID_TOP + GRID_H));
  doc.setLineDashPattern([], 0);

  // Seats — each seat carries its zone code, with a thin border so the
  // grid stays crisp on paper (esp. the light "Invités" seats).
  doc.setDrawColor(90, 90, 90);
  doc.setLineWidth(s(0.15));
  doc.setFont("helvetica", "bold");
  seatingGrid.forEach((row, r) => {
    row.forEach((z, c) => {
      const isLeft = c < LEFT_COLS;
      const x = isLeft ? STARTX + c * (SEAT + GX) : RIGHTX + (c - LEFT_COLS) * (SEAT + GX);
      const y = GRID_TOP + r * ROW_PITCH;
      doc.setFillColor(...rgb(PRINT[z].fill));
      doc.roundedRect(s(x), s(y), s(SEAT), s(SEAT), s(0.5), s(0.5), "FD");
      const lbl = seatLabel(z);
      if (lbl) {
        doc.setTextColor(...rgb(PRINT[z].text));
        doc.setFontSize(s(5.9));
        doc.text(lbl, s(x + SEAT / 2), s(y + SEAT / 2), { align: "center", baseline: "middle" });
      }
    });
  });

  // Legend
  const legTop = GRID_TOP + GRID_H + 9;
  LEGEND.forEach((z, i) => {
    const col = i < 5 ? 0 : 1;
    const rowI = i % 5;
    const lx = col === 0 ? STARTX : 112;
    const ly = legTop + rowI * 7;
    doc.setFillColor(...rgb(PRINT[z].fill));
    doc.roundedRect(s(lx), s(ly - 3.2), s(4), s(4), s(0.5), s(0.5), "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(s(8.5));
    doc.setTextColor(...rgb("#0F2560"));
    doc.text(PRINT[z].label, s(lx + 6), s(ly));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(s(7.5));
    doc.setTextColor(140, 140, 140);
    doc.text(PRINT[z].where, s(lx + 6), s(ly + 3.4));
  });

  // Note
  const noteY = legTop + 5 * 7 + 4;
  doc.setFillColor(...rgb("#F5F2E8"));
  doc.rect(s(STARTX), s(noteY), s(GRIDW), s(15), "F");
  doc.setFillColor(...rgb("#F0B429"));
  doc.rect(s(STARTX), s(noteY), s(1.2), s(15), "F");
  doc.setTextColor(68, 68, 68);
  doc.setFontSize(s(8));
  doc.setFont("helvetica", "bold");
  doc.text("Comment trouver votre place :", s(STARTX + 4), s(noteY + 5));
  doc.setFont("helvetica", "normal");
  doc.text("Reperez votre categorie dans la legende, puis rejoignez la zone correspondante.", s(STARTX + 4), s(noteY + 9));
  doc.text("Diplomes a droite (par specialite), invites a gauche, profs / admin aux 3 premiers rangs.", s(STARTX + 4), s(noteY + 13));

  // Footer
  doc.setTextColor(170, 170, 170);
  doc.setFontSize(s(7));
  doc.text("ESEN AMBASSADORS  -  PLAN INDICATIF", s(105), s(290), { align: "center", charSpace: s(0.5) });

  const buf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Plan-salle-ESEN-2026-${size.toUpperCase()}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
