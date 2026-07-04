// components/sections/SeatingSection.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { seatingGrid, zoneConfig, ZoneKey, LEFT_COLS } from "@/data/seating";

const FILTER_ZONES: ZoneKey[] = ["BIS", "BI", "EB", "M2", "MDS", "ESEN", "Laur", "Admin", "Invite"];

const RIGHT_COLS = 16;

export default function SeatingSection() {
  const t = useTranslations("seating");
  const locale = useLocale();
  const [active, setActive] = useState<ZoneKey | "All">("All");
  const [isMobile, setIsMobile] = useState(false);

  // detect mobile width < 768px
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Numeric, device-aware sizing so the grid has a predictable intrinsic width
  // that we can scroll horizontally on small screens instead of overflowing the page.
  const seatPx = isMobile ? 17 : 24;
  const gapPx = isMobile ? 3 : 4;
  const sepPx = isMobile ? 10 : 14;
  const rowGapPx = isMobile ? 3 : 4;
  const fontPx = isMobile ? 7 : 9;

  const leftWidth = LEFT_COLS * seatPx + (LEFT_COLS - 1) * gapPx;
  const rightWidth = RIGHT_COLS * seatPx + (RIGHT_COLS - 1) * gapPx;
  const gridWidth = leftWidth + sepPx + rightWidth;

  const seatStyle = (zone: ZoneKey, dim: boolean, isHighlighted: boolean) => {
    const cfg = zoneConfig[zone];
    return {
      width: seatPx,
      height: seatPx,
      fontSize: fontPx,
      borderRadius: 4,
      background: cfg.color,
      border: `1px solid ${cfg.border}`,
      color: cfg.text,
      opacity: dim ? 0.1 : 1,
      transform: isHighlighted ? "scale(1.10)" : "scale(1)",
      boxShadow: isHighlighted ? `0 0 10px ${cfg.glow}` : "none",
      flexShrink: 0,
    } as const;
  };

  const seatLabel = (zone: ZoneKey) =>
    zone !== "Admin" && zone !== "Invite" && zone !== "EMPTY" ? zone : "";

  return (
    <section id="seating" className="py-24 px-4 overflow-x-hidden" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 30%, #0F2560 0%, #1C0F06 65%)" }}>
      {/* Eyebrow + Title */}
      <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true, margin: "-80px" }}>
        <p className="text-xs uppercase tracking-[0.18em] text-[#F0B429] mb-3">{t("eyebrow")}</p>
        <h2 className="font-playfair text-4xl md:text-5xl text-white">{t("title")}</h2>
        <div className="mx-auto mt-4 h-px w-32" style={{ background: "linear-gradient(90deg,#1B3A8C,#F0B429,#1B3A8C)" }} />
      </motion.div>

      {/* SCÈNE pill centered above map */}
      <div className="flex justify-center mb-8">
        <div className="px-10 py-3 rounded-full text-white font-medium tracking-widest text-sm" style={{
          background: "linear-gradient(135deg,#1B3A8C,#2E55B8)",
          border: "1px solid rgba(240,180,41,0.30)",
          boxShadow: "0 0 32px rgba(27,58,140,0.5)"
        }}>
          🎭 SCÈNE
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-6 px-2">
        <button onClick={() => setActive("All")} className="px-4 py-1.5 rounded-full text-[11px] uppercase tracking-[0.10em] transition-all duration-250 cursor-pointer" style={active === "All" ? { background: "linear-gradient(135deg,#1B3A8C,#F0B429)", border: "none", color: "#FFFFFF", boxShadow: "0 0 16px rgba(240,180,41,0.3)" } : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#F5ECD7" }}>
          {t("filter.all")}
        </button>
        {FILTER_ZONES.map(zone => {
          const cfg = zoneConfig[zone];
          const isActive = active === zone;
          return (
            <button key={zone} onClick={() => setActive(zone)} className="px-4 py-1.5 rounded-full text-[11px] uppercase tracking-[0.10em] transition-all duration-250 cursor-pointer" style={isActive ? { background: cfg.color, border: `1px solid ${cfg.border}`, color: cfg.text, boxShadow: `0 0 16px ${cfg.glow}` } : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#F5ECD7" }}>
              {locale === "fr" ? cfg.labelFr : cfg.label}
            </button>
          );
        })}
      </div>

      {/* Scroll hint (mobile only) */}
      {isMobile && (
        <p className="text-center mb-3" style={{ color: "#B8860B", fontSize: "11px" }}>
          {t("mobile.hint")}
        </p>
      )}

      {/* Horizontal-scroll container: the wide map scrolls inside this box instead of
          overflowing the whole page. On desktop it simply centers (no scroll needed). */}
      <div style={{ maxWidth: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "6px" }}>
        <div
          style={{
            width: gridWidth + 32, // + horizontal padding (1rem each side, border-box)
            boxSizing: "border-box",
            margin: "0 auto",
            background: "linear-gradient(135deg,rgba(27,58,140,0.08),rgba(255,220,120,0.04),rgba(15,37,96,0.12))",
            border: "1px solid rgba(240,180,41,0.15)",
            backdropFilter: "blur(16px)",
            padding: "1rem",
          }}
        >
          {/* Header row */}
          <div style={{ display: "flex", gap: sepPx, marginBottom: "8px", alignItems: "center" }}>
            <div style={{ width: leftWidth, textAlign: "center", color: "rgba(245,236,215,0.45)", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              {locale === "fr" ? "PROFS · ADMIN / INVITÉS" : "FACULTY / GUESTS"}
            </div>
            <div style={{ width: sepPx, flexShrink: 0 }} />
            <div style={{ width: rightWidth, textAlign: "center", color: "#F0B429", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              {locale === "fr" ? "DIPLÔMÉS" : "GRADUATES"}
            </div>
          </div>

          {/* Grid rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: rowGapPx }}>
            {seatingGrid.map((row, rowIdx) => {
              const left = row.slice(0, LEFT_COLS);
              const right = row.slice(LEFT_COLS);
              return (
                <div key={rowIdx} style={{ display: "flex", gap: sepPx, alignItems: "center" }}>
                  {/* Left block */}
                  <div style={{ display: "flex", flexDirection: "row", gap: gapPx, flexShrink: 0 }}>
                    {left.map((zone, colIdx) => {
                      const isHighlighted = active === zone;
                      const dim = active !== "All" && !isHighlighted;
                      return (
                        <div key={colIdx}
                          title={locale === "fr" ? zoneConfig[zone].labelFr : zoneConfig[zone].label}
                          className="flex items-center justify-center select-none"
                          style={seatStyle(zone, dim, isHighlighted)}>
                          {seatLabel(zone)}
                        </div>
                      );
                    })}
                  </div>
                  {/* Separator */}
                  <div style={{ width: sepPx, flexShrink: 0, alignSelf: "stretch", background: "linear-gradient(180deg, transparent, rgba(240,180,41,0.25) 20%, rgba(240,180,41,0.25) 80%, transparent)" }} />
                  {/* Right block */}
                  <div style={{ display: "flex", flexDirection: "row", gap: gapPx, flexShrink: 0 }}>
                    {right.map((zone, colIdx) => {
                      const isHighlighted = active === zone;
                      const dim = active !== "All" && !isHighlighted;
                      return (
                        <div key={colIdx}
                          title={locale === "fr" ? zoneConfig[zone].labelFr : zoneConfig[zone].label}
                          className="flex items-center justify-center select-none"
                          style={seatStyle(zone, dim, isHighlighted)}>
                          {seatLabel(zone)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-8 px-2">
        {FILTER_ZONES.map(zone => {
          const cfg = zoneConfig[zone];
          return (
            <button key={zone} onClick={() => setActive(zone === active ? "All" : zone)} className="flex items-center gap-2 cursor-pointer transition-opacity duration-200 hover:opacity-80">
              <div className="w-3.5 h-3.5 rounded-[3px] flex-shrink-0" style={{ background: cfg.color, border: `1px solid ${cfg.border}` }} />
              <span className="text-[12px]" style={{ color: "#F5ECD7" }}>{locale === "fr" ? cfg.labelFr : cfg.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
