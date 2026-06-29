// components/sections/SeatingSection.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { seatingGrid, zoneConfig, ZoneKey, LEFT_COLS } from "@/data/seating";

const FILTER_ZONES: ZoneKey[] = ["BIS", "BI", "EB", "M2", "MDS", "ESEN", "Laur", "Admin"];

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

  const seatSize = {
    width: "clamp(14px,1.4vw,26px)",
    height: "clamp(14px,1.4vw,26px)",
    fontSize: "clamp(5px,0.65vw,8px)",
    borderRadius: "4px",
    gap: "clamp(2px,0.3vw,4px)"
  };

  const rowGap = "clamp(2px,0.3vw,4px)"; // vertical gap between rows
  const sepWidth = "clamp(4px,0.8vw,12px)"; // separator width (reduced further)
  const blockGap = seatSize.gap; // gap between seats in a block

  return (
    <section id="seating" className="py-24 px-4" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 30%, #0F2560 0%, #1C0F06 65%)" }}>
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
      <div className="flex flex-wrap justify-center gap-2 mb-8">
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

      {/* Full grid wrapper */}
      <div className="w-full max-w-[1200px] mx-auto" style={{ background: "linear-gradient(135deg,rgba(27,58,140,0.08),rgba(255,220,120,0.04),rgba(15,37,96,0.12))", border: "1px solid rgba(240,180,41,0.15)", backdropFilter: "blur(16px)", padding: "1rem" }}>
        {/* Header row */}
        <div className="flex" style={{ gap: sepWidth, marginBottom: "8px", alignItems: "center" }}>
          <div style={{ flex: LEFT_COLS, textAlign: "center", color: "rgba(245,236,215,0.45)", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em" }}>
            {locale === "fr" ? "VIP / INVITÉS" : "VIP / GUESTS"}
          </div>
          <div style={{ width: sepWidth, flexShrink: 0 }} />
          <div style={{ flex: 16, textAlign: "center", color: "#F0B429", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em" }}>
            {locale === "fr" ? "DIPLÔMÉS" : "GRADUATES"}
          </div>
        </div>

        {/* Grid rows */}
        <div className="flex flex-col" style={{ gap: rowGap, width: "100%" }}>
          {seatingGrid.map((row, rowIdx) => {
            const left = row.slice(0, LEFT_COLS);
            const right = row.slice(LEFT_COLS);
            return (
              <div key={rowIdx} className="flex" style={{ gap: sepWidth, alignItems: "center" }}>
                {/* Left block */}
                <div style={{ flex: LEFT_COLS, display: "flex", flexDirection: "row", gap: blockGap, flexShrink: 0 }}>
                  {left.map((zone, colIdx) => {
                    const cfg = zoneConfig[zone];
                    const isHighlighted = active === zone;
                    const dim = active !== "All" && !isHighlighted;
                    return (
                      <div key={colIdx}
                        title={locale === "fr" ? cfg.labelFr : cfg.label}
                        className="flex items-center justify-center select-none"
                        style={{
                          width: seatSize.width,
                          height: seatSize.height,
                          fontSize: seatSize.fontSize,
                          borderRadius: seatSize.borderRadius,
                          background: cfg.color,
                          border: `1px solid ${cfg.border}`,
                          color: cfg.text,
                          opacity: dim ? 0.08 : 1,
                          transform: isHighlighted ? "scale(1.10)" : "scale(1)",
                          boxShadow: isHighlighted ? `0 0 10px ${cfg.glow}` : "none"
                        }}>
                        {zone !== "Admin" && zone !== "Invite" && zone !== "EMPTY" ? zone : ""}
                      </div>
                    );
                  })}
                </div>
                {/* Separator */}
                <div style={{ width: sepWidth, flexShrink: 0, background: "linear-gradient(180deg, transparent, rgba(240,180,41,0.25) 20%, rgba(240,180,41,0.25) 80%, transparent)" }} />
                {/* Right block */}
                <div style={{ display: "flex", flexDirection: "row", gap: blockGap, flexShrink: 0 }}>
                  {right.map((zone, colIdx) => {
                    const cfg = zoneConfig[zone];
                    const isHighlighted = active === zone;
                    const dim = active !== "All" && !isHighlighted;
                    return (
                      <div key={colIdx}
                        title={locale === "fr" ? cfg.labelFr : cfg.label}
                        className="flex items-center justify-center select-none"
                        style={{
                          width: seatSize.width,
                          height: seatSize.height,
                          fontSize: seatSize.fontSize,
                          borderRadius: seatSize.borderRadius,
                          background: cfg.color,
                          border: `1px solid ${cfg.border}`,
                          color: cfg.text,
                          opacity: dim ? 0.12 : 1,
                          transform: isHighlighted ? "scale(1.10)" : "scale(1)",
                          boxShadow: isHighlighted ? `0 0 10px ${cfg.glow}` : "none"
                        }}>
                        {zone !== "Admin" && zone !== "Invite" && zone !== "EMPTY" ? zone : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile note */}
        {isMobile && (
          <p style={{ color: "#B8860B", fontSize: "11px", textAlign: "center", marginTop: "1rem" }}>
            {locale === "fr" ? "Places VIP & Invités non affichées sur mobile" : "VIP & Guest seating not shown on mobile"}
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-8">
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
