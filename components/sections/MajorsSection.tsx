"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { licenceMajors, masterMajors, type MajorCard } from "../../data/majors";
import { GlassCard } from "../ui/GlassCard";
import { ProfileImage } from "../ui/OptimizedImage";

function MajorCardView({ major, index }: { major: MajorCard; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="w-full group"
    >
      <GlassCard className="h-full p-4 sm:p-5 flex flex-col items-center justify-center text-center transition-all duration-300 group-hover:-translate-y-1.5 relative overflow-hidden">
        {major.imageUrl ? (
          <ProfileImage
            src={major.imageUrl}
            alt={major.name}
            size={84}
            className="mb-4 rounded-full border-2 border-[#C9960C] shadow-[0_0_15px_rgba(201,150,12,0.3)]"
          />
        ) : (
          <div
            className="mb-4 flex items-center justify-center rounded-full border-2 border-dashed border-[rgba(201,150,12,0.4)]"
            style={{ width: 84, height: 84 }}
          >
            <span style={{ fontSize: 28 }}>🎓</span>
          </div>
        )}
        <div className="font-sans text-[11px] uppercase tracking-[0.12em] text-[#F0C040] mb-1">{major.specialty}</div>
        <h3 className="font-serif text-[clamp(15px,1.6vw,19px)] text-[#E8E0D0] leading-tight">{major.name}</h3>
        {major.score && (
          <div className="mt-3 inline-block px-3 py-1 bg-[rgba(201,150,12,0.08)] border border-[rgba(201,150,12,0.3)] rounded-full text-[#F0C040] font-sans text-[10px] font-semibold tracking-widest">
            {major.score}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9960C] to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-300" />
      </GlassCard>
    </motion.div>
  );
}

export function MajorsSection() {
  const t = useTranslations("students");
  const [tab, setTab] = useState<"licence" | "master">("licence");

  const data = tab === "licence" ? licenceMajors : masterMajors;

  // Group consecutive cards into specialty pairs so the two cards of the same
  // specialty stack vertically in one column (BI under BI, BIS under BIS, …).
  const pairs: MajorCard[][] = [];
  for (let i = 0; i < data.length; i += 2) pairs.push(data.slice(i, i + 2));

  const gridCls =
    tab === "licence"
      ? "grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
      : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5";

  return (
    <section id="majors" className="relative w-full py-[clamp(80px,10vw,160px)] bg-[#0D0B0E] overflow-hidden">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={{
          hidden: { opacity: 0, y: 24 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
        }}
        className="text-center mb-10 px-4"
      >
        <div className="font-sans uppercase tracking-[0.15em] text-[13px] text-[#8A6A1A] mb-4">{t("eyebrow")}</div>
        <h2 className="font-display text-[clamp(32px,4vw,60px)] text-white text-glow-gold">{t("title")}</h2>
      </motion.div>

      {/* Tabs */}
      <div className="flex justify-center gap-3 mb-12 px-4">
        {(["licence", "master"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="px-7 py-2.5 rounded-full text-sm font-medium uppercase tracking-[0.12em] transition-all duration-300 cursor-pointer"
            style={
              tab === k
                ? { background: "linear-gradient(135deg,#1B3A8C,#F0B429)", color: "#FFFFFF", border: "none", boxShadow: "0 0 20px rgba(240,180,41,0.3)" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(240,180,41,0.25)", color: "#F5ECD7" }
            }
          >
            {k === "licence" ? "Licence" : "Master"}
          </button>
        ))}
      </div>

      <div className="w-full px-4 md:px-8 max-w-7xl mx-auto">
        <div key={tab} className={gridCls}>
          {pairs.map((pair, pi) => (
            <div key={pi} className="flex flex-col gap-4 md:gap-6">
              {pair.map((m, i) => (
                <MajorCardView key={m.id} major={m} index={pi * 2 + i} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
