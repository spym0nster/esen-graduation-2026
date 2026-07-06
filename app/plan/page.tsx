"use client";

import { seatingGrid, LEFT_COLS, ZoneKey } from "@/data/seating";

// Print-friendly SOLID colors (the site palette is semi-transparent on a dark
// bg; here everything sits on white paper, so we use opaque fills).
const PRINT: Record<ZoneKey, { fill: string; text: string; label: string; where: string }> = {
  BIS:   { fill: "#1B3A8C", text: "#fff", label: "Business Information System", where: "Diplômés — bloc 1" },
  BI:    { fill: "#0F2560", text: "#fff", label: "Business Intelligence",        where: "Diplômés — bloc 2" },
  EB:    { fill: "#0091B5", text: "#fff", label: "E-Business",                   where: "Diplômés — bloc 3" },
  M2:    { fill: "#0074B0", text: "#fff", label: "Master 2",                     where: "Diplômés — bloc 4" },
  MDS:   { fill: "#F0B429", text: "#3a2a00", label: "E-Marketing & Digital Strategies", where: "Diplômés — rangée 19" },
  ESEN:  { fill: "#3E67C0", text: "#fff", label: "ESEN Général",                 where: "Diplômés — fond de salle" },
  Laur:  { fill: "#B8901A", text: "#fff", label: "Lauréats",                     where: "Diplômés — rangées 17-18" },
  Admin: { fill: "#9B6FBF", text: "#fff", label: "Professeurs / Administration", where: "Avant, côté gauche (3 rangs)" },
  Invite:{ fill: "#EBE7DA", text: "#5a5340", label: "Invités",                   where: "Côté gauche" },
  EMPTY: { fill: "transparent", text: "transparent", label: "", where: "" },
};

const LEGEND: ZoneKey[] = ["Admin", "Invite", "BIS", "BI", "EB", "M2", "Laur", "MDS", "ESEN"];
const seatLabel = (z: ZoneKey) => (z !== "Admin" && z !== "Invite" && z !== "EMPTY" ? z : "");

export default function PlanPage() {
  return (
    <div className="wrap">
      <style>{`
        @page { size: A4 portrait; margin: 8mm; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #f3f4f6; }
        .wrap { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; }
        .wrap, .sheet, .seat, .stage span, .sw, .rule, .note, .colhdr div {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .sheet {
          width: 210mm; min-height: 297mm; margin: 12px auto; background: #fff;
          padding: 12mm 12mm 10mm; box-shadow: 0 4px 24px rgba(0,0,0,.15);
        }
        .toolbar { max-width: 210mm; margin: 12px auto 0; display: flex; gap: 10px; justify-content: flex-end; }
        .btn { padding: 9px 18px; border-radius: 8px; border: 1px solid #1B3A8C; background: #1B3A8C; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; }
        .btn.ghost { background: #fff; color: #1B3A8C; }
        .eyebrow { font-size: 10px; letter-spacing: 4px; color: #B8901A; font-weight: 700; text-align: center; }
        .title { font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 800; color: #0F2560; text-align: center; margin: 4px 0 2px; }
        .sub { text-align: center; font-size: 12px; color: #555; margin-bottom: 10px; }
        .rule { height: 2px; background: linear-gradient(90deg,#1B3A8C,#F0B429,#1B3A8C); margin: 0 auto 14px; width: 180px; }
        .stage { text-align: center; margin: 0 auto 12px; }
        .stage span { display: inline-block; background: #0F2560; color: #fff; padding: 7px 46px; border-radius: 20px; font-size: 13px; font-weight: 700; letter-spacing: 5px; }
        .colhdr { display: flex; gap: 8mm; margin-bottom: 5px; }
        .colhdr div { text-align: center; font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #333; text-transform: uppercase; }
        .grid { display: flex; flex-direction: column; gap: 2px; align-items: center; }
        .row { display: flex; gap: 8mm; align-items: center; }
        .block { display: flex; gap: 2px; }
        .seat { width: 5mm; height: 5mm; border-radius: 1px; display: flex; align-items: center; justify-content: center; font-size: 4.5px; font-weight: 700; }
        .aisle { width: 8mm; align-self: stretch; position: relative; }
        .aisle::before { content: ""; position: absolute; left: 50%; top: 6%; bottom: 6%; width: 1px; background: repeating-linear-gradient(180deg,#bbb 0 3px,transparent 3px 6px); }
        .legend { margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 22px; }
        .li { display: flex; align-items: center; gap: 8px; font-size: 11px; }
        .sw { width: 13px; height: 13px; border-radius: 2px; flex-shrink: 0; border: 1px solid rgba(0,0,0,.15); }
        .li b { color: #0F2560; font-weight: 700; }
        .li .where { color: #777; }
        .note { margin-top: 14px; padding: 8px 12px; background: #f5f2e8; border-left: 3px solid #F0B429; font-size: 11px; color: #444; line-height: 1.5; }
        .foot { margin-top: 12px; text-align: center; font-size: 9px; color: #999; letter-spacing: 1px; }
        @media print {
          html, body { background: #fff; }
          .toolbar { display: none !important; }
          .sheet { box-shadow: none; margin: 0; width: auto; min-height: auto; padding: 0; }
        }
      `}</style>

      <div className="toolbar">
        <button className="btn ghost" onClick={() => history.back()}>← Retour</button>
        <button className="btn" onClick={() => window.print()}>🖨 Imprimer / PDF</button>
      </div>

      <div className="sheet">
        <div className="eyebrow">ESEN · GRADUATION 2026</div>
        <div className="title">Plan de la salle</div>
        <div className="sub">Cérémonie de remise des diplômes · 9 juillet 2026 · UTICA</div>
        <div className="rule" />

        <div className="stage"><span>SCÈNE</span></div>

        <div className="colhdr">
          <div style={{ width: `calc(${LEFT_COLS} * 5mm + ${LEFT_COLS - 1} * 2px)` }}>Profs · Admin / Invités</div>
          <div style={{ width: "8mm" }} />
          <div style={{ width: `calc(16 * 5mm + 15 * 2px)`, color: "#B8901A" }}>Diplômés</div>
        </div>

        <div className="grid">
          {seatingGrid.map((row, i) => {
            const left = row.slice(0, LEFT_COLS);
            const right = row.slice(LEFT_COLS);
            return (
              <div className="row" key={i}>
                <div className="block">
                  {left.map((z, c) => (
                    <div key={c} className="seat" style={{ background: PRINT[z].fill, color: PRINT[z].text }}>{seatLabel(z)}</div>
                  ))}
                </div>
                <div className="aisle" />
                <div className="block">
                  {right.map((z, c) => (
                    <div key={c} className="seat" style={{ background: PRINT[z].fill, color: PRINT[z].text }}>{seatLabel(z)}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="legend">
          {LEGEND.map((z) => (
            <div className="li" key={z}>
              <div className="sw" style={{ background: PRINT[z].fill }} />
              <span><b>{PRINT[z].label}</b> — <span className="where">{PRINT[z].where}</span></span>
            </div>
          ))}
        </div>

        <div className="note">
          <b>Comment trouver votre place :</b> repérez votre catégorie dans la légende, puis rejoignez la zone correspondante.
          Les <b>diplômés</b> sont à droite (par spécialité), les <b>invités</b> à gauche, et les <b>professeurs / administration</b> aux 3 premiers rangs avant, côté gauche.
        </div>

        <div className="foot">ESEN AMBASSADORS · PLAN INDICATIF</div>
      </div>
    </div>
  );
}
