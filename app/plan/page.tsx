"use client";

import { seatingGrid, LEFT_COLS, ZoneKey } from "@/data/seating";

const PRINT: Record<ZoneKey, { fill: string; text: string; label: string; where: string }> = {
  BIS:   { fill: "#1B3A8C", text: "#fff",    label: "Business Information System", where: "Diplômés — bloc 1" },
  BI:    { fill: "#0F2560", text: "#fff",    label: "Business Intelligence",       where: "Diplômés — bloc 2" },
  EB:    { fill: "#0091B5", text: "#fff",    label: "E-Business",                  where: "Diplômés — bloc 3" },
  M2:    { fill: "#0074B0", text: "#fff",    label: "Master 2",                    where: "Diplômés — bloc 4" },
  MDS:   { fill: "#F0B429", text: "#3a2a00", label: "E-Marketing & Digital Strat.", where: "Diplômés — rangée 19" },
  ESEN:  { fill: "#3E67C0", text: "#fff",    label: "ESEN Général",                where: "Diplômés — fond de salle" },
  Laur:  { fill: "#B8901A", text: "#fff",    label: "Lauréats",                    where: "Diplômés — rangées 17-18" },
  Admin: { fill: "#9B6FBF", text: "#fff",    label: "Professeurs / Administration", where: "Avant gauche (3 rangs)" },
  Invite:{ fill: "#EBE7DA", text: "#5a5340", label: "Invités",                     where: "Côté gauche" },
  EMPTY: { fill: "transparent", text: "transparent", label: "", where: "" },
};

const LEGEND: ZoneKey[] = ["Admin", "Invite", "BIS", "BI", "EB", "M2", "Laur", "MDS", "ESEN"];
const seatLabel = (z: ZoneKey) => (z !== "Admin" && z !== "Invite" && z !== "EMPTY" ? z : "");

// ── SVG geometry (A4 portrait canvas: 794 × 1123 @ 96dpi) ──
const W = 794, H = 1123;
const SEAT = 18, GX = 2, GY = 2, AISLE = 24;
const LEFTW = LEFT_COLS * SEAT + (LEFT_COLS - 1) * GX;      // 278
const RIGHTW = 16 * SEAT + 15 * GX;                          // 318
const GRIDW = LEFTW + AISLE + RIGHTW;                        // 620
const STARTX = Math.round((W - GRIDW) / 2);                  // ~87
const RIGHTX = STARTX + LEFTW + AISLE;
const GRID_TOP = 250;
const GRID_H = seatingGrid.length * SEAT + (seatingGrid.length - 1) * GY;

export default function PlanPage() {
  const seats: React.ReactNode[] = [];
  seatingGrid.forEach((row, r) => {
    row.forEach((z, c) => {
      const isLeft = c < LEFT_COLS;
      const x = isLeft ? STARTX + c * (SEAT + GX) : RIGHTX + (c - LEFT_COLS) * (SEAT + GX);
      const y = GRID_TOP + r * (SEAT + GY);
      const p = PRINT[z];
      seats.push(<rect key={`${r}-${c}`} x={x} y={y} width={SEAT} height={SEAT} rx={2} fill={p.fill} />);
      const lbl = seatLabel(z);
      if (lbl) seats.push(
        <text key={`t${r}-${c}`} x={x + SEAT / 2} y={y + SEAT / 2 + 2} textAnchor="middle" fontSize={5.5} fontWeight={700} fill={p.text}>{lbl}</text>
      );
    });
  });

  return (
    <div className="wrap">
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        html, body { margin: 0; padding: 0; background: #eceff3; }
        .wrap { font-family: Arial, Helvetica, sans-serif; }
        .toolbar { max-width: 794px; margin: 14px auto 0; display: flex; gap: 10px; justify-content: flex-end; }
        .btn { padding: 9px 18px; border-radius: 8px; border: 1px solid #1B3A8C; background: #1B3A8C; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; }
        .btn.ghost { background: #fff; color: #1B3A8C; }
        .card { max-width: 794px; margin: 14px auto; background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,.15); }
        .card svg { display: block; width: 100%; height: auto; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; width: 210mm; }
          .wrap { margin: 0 !important; padding: 0 !important; }
          .toolbar { display: none !important; }
          .card { max-width: none !important; width: 210mm !important; height: 297mm !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
          .card svg { width: 210mm !important; height: 297mm !important; display: block !important; }
        }
      `}</style>

      <div className="toolbar">
        <button className="btn ghost" onClick={() => history.back()}>← Retour</button>
        <button className="btn ghost" onClick={() => window.print()}>🖨 Imprimer</button>
        <button className="btn" onClick={() => window.open("/api/plan-pdf", "_blank")}>⬇ Télécharger le PDF</button>
      </div>

      <div className="card">
        <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plan de la salle de la cérémonie">
          <rect x={0} y={0} width={W} height={H} fill="#ffffff" />

          {/* Header */}
          <text x={W / 2} y={54} textAnchor="middle" fontSize={11} letterSpacing={4} fontWeight={700} fill="#B8901A">ESEN · GRADUATION 2026</text>
          <text x={W / 2} y={92} textAnchor="middle" fontSize={30} fontWeight={800} fontFamily="Georgia, serif" fill="#0F2560">Plan de la salle</text>
          <text x={W / 2} y={116} textAnchor="middle" fontSize={13} fill="#555">Cérémonie de remise des diplômes · 9 juillet 2026 · UTICA</text>
          <rect x={W / 2 - 90} y={130} width={180} height={2.5} fill="#F0B429" />

          {/* Stage */}
          <rect x={W / 2 - 95} y={158} width={190} height={34} rx={17} fill="#0F2560" />
          <text x={W / 2} y={180} textAnchor="middle" fontSize={14} fontWeight={700} letterSpacing={6} fill="#fff">SCÈNE</text>

          {/* Column headers */}
          <text x={STARTX + LEFTW / 2} y={236} textAnchor="middle" fontSize={11} fontWeight={700} letterSpacing={1.5} fill="#333">PROFS · ADMIN / INVITÉS</text>
          <text x={RIGHTX + RIGHTW / 2} y={236} textAnchor="middle" fontSize={11} fontWeight={700} letterSpacing={1.5} fill="#B8901A">DIPLÔMÉS</text>

          {/* Aisle dashed line */}
          <line x1={STARTX + LEFTW + AISLE / 2} y1={GRID_TOP} x2={STARTX + LEFTW + AISLE / 2} y2={GRID_TOP + GRID_H} stroke="#c4c4c4" strokeWidth={1} strokeDasharray="3 3" />

          {/* Seats */}
          {seats}

          {/* Legend */}
          {LEGEND.map((z, i) => {
            const col = i < 5 ? 0 : 1;
            const rowI = i % 5;
            const lx = col === 0 ? STARTX : W / 2 + 10;
            const ly = GRID_TOP + GRID_H + 40 + rowI * 26;
            const p = PRINT[z];
            return (
              <g key={z}>
                <rect x={lx} y={ly - 11} width={14} height={14} rx={2} fill={p.fill} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
                <text x={lx + 22} y={ly} fontSize={11.5} fill="#0F2560" fontWeight={700}>{p.label}</text>
                <text x={lx + 22} y={ly + 13} fontSize={10} fill="#888">{p.where}</text>
              </g>
            );
          })}

          {/* Note */}
          <rect x={STARTX} y={GRID_TOP + GRID_H + 190} width={GRIDW} height={54} fill="#f5f2e8" />
          <rect x={STARTX} y={GRID_TOP + GRID_H + 190} width={3} height={54} fill="#F0B429" />
          <text x={STARTX + 14} y={GRID_TOP + GRID_H + 210} fontSize={11} fill="#444"><tspan fontWeight={700}>Comment trouver votre place : </tspan>repérez votre catégorie dans la légende,</text>
          <text x={STARTX + 14} y={GRID_TOP + GRID_H + 226} fontSize={11} fill="#444">puis rejoignez la zone correspondante. Diplômés à droite (par spécialité),</text>
          <text x={STARTX + 14} y={GRID_TOP + GRID_H + 242} fontSize={11} fill="#444">invités à gauche, professeurs / administration aux 3 premiers rangs avant.</text>

          {/* Footer */}
          <text x={W / 2} y={H - 20} textAnchor="middle" fontSize={9} letterSpacing={1} fill="#aaa">ESEN AMBASSADORS · PLAN INDICATIF</text>
        </svg>
      </div>
    </div>
  );
}
