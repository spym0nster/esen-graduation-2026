import { NextResponse } from "next/server";
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

// Geometry (mm, A4 portrait 210 x 297)
const SEAT = 5.75, GX = 0.4, GY = 0.4, AISLE = 5;
const LEFTW = LEFT_COLS * SEAT + (LEFT_COLS - 1) * GX;
const RIGHTW = 16 * SEAT + 15 * GX;
const GRIDW = LEFTW + AISLE + RIGHTW;
const STARTX = (210 - GRIDW) / 2;
const RIGHTX = STARTX + LEFTW + AISLE;
const GRID_TOP = 57;
const ROW_PITCH = SEAT + GY;
const GRID_H = (seatingGrid.length - 1) * ROW_PITCH + SEAT;

export async function GET() {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setFont("helvetica", "normal");

  // Header
  doc.setTextColor(...rgb("#B8901A"));
  doc.setFontSize(8);
  doc.text("ESEN  -  GRADUATION 2026", 105, 16, { align: "center", charSpace: 1 });
  doc.setTextColor(...rgb("#0F2560"));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Plan de la salle", 105, 26, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.setFontSize(10);
  doc.text("Ceremonie de remise des diplomes  -  9 juillet 2026  -  UTICA", 105, 33, { align: "center" });
  doc.setDrawColor(...rgb("#F0B429"));
  doc.setLineWidth(0.8);
  doc.line(60, 37, 150, 37);

  // Stage
  doc.setFillColor(...rgb("#0F2560"));
  doc.roundedRect(75, 42, 60, 9, 4.5, 4.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("SCENE", 105, 48.2, { align: "center", charSpace: 2 });

  // Column headers
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text("PROFS - ADMIN / INVITES", STARTX + LEFTW / 2, 56, { align: "center", charSpace: 0.4 });
  doc.setTextColor(...rgb("#B8901A"));
  doc.text("DIPLOMES", RIGHTX + RIGHTW / 2, 56, { align: "center", charSpace: 0.6 });

  // Aisle dashed line
  doc.setDrawColor(196, 196, 196);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(STARTX + LEFTW + AISLE / 2, GRID_TOP, STARTX + LEFTW + AISLE / 2, GRID_TOP + GRID_H);
  doc.setLineDashPattern([], 0);

  // Seats — each seat carries its zone code, with a thin border so the
  // grid stays crisp on paper (esp. the light "Invités" seats).
  doc.setDrawColor(90, 90, 90);
  doc.setLineWidth(0.15);
  doc.setFont("helvetica", "bold");
  seatingGrid.forEach((row, r) => {
    row.forEach((z, c) => {
      const isLeft = c < LEFT_COLS;
      const x = isLeft ? STARTX + c * (SEAT + GX) : RIGHTX + (c - LEFT_COLS) * (SEAT + GX);
      const y = GRID_TOP + r * ROW_PITCH;
      doc.setFillColor(...rgb(PRINT[z].fill));
      doc.roundedRect(x, y, SEAT, SEAT, 0.5, 0.5, "FD");
      const lbl = seatLabel(z);
      if (lbl) {
        doc.setTextColor(...rgb(PRINT[z].text));
        doc.setFontSize(5.9);
        doc.text(lbl, x + SEAT / 2, y + SEAT / 2, { align: "center", baseline: "middle" });
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
    doc.roundedRect(lx, ly - 3.2, 4, 4, 0.5, 0.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...rgb("#0F2560"));
    doc.text(PRINT[z].label, lx + 6, ly);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text(PRINT[z].where, lx + 6, ly + 3.4);
  });

  // Note
  const noteY = legTop + 5 * 7 + 4;
  doc.setFillColor(...rgb("#F5F2E8"));
  doc.rect(STARTX, noteY, GRIDW, 15, "F");
  doc.setFillColor(...rgb("#F0B429"));
  doc.rect(STARTX, noteY, 1.2, 15, "F");
  doc.setTextColor(68, 68, 68);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Comment trouver votre place :", STARTX + 4, noteY + 5);
  doc.setFont("helvetica", "normal");
  doc.text("Reperez votre categorie dans la legende, puis rejoignez la zone correspondante.", STARTX + 4, noteY + 9);
  doc.text("Diplomes a droite (par specialite), invites a gauche, profs / admin aux 3 premiers rangs.", STARTX + 4, noteY + 13);

  // Footer
  doc.setTextColor(170, 170, 170);
  doc.setFontSize(7);
  doc.text("ESEN AMBASSADORS  -  PLAN INDICATIF", 105, 290, { align: "center", charSpace: 0.5 });

  const buf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Plan-salle-ESEN-2026.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
