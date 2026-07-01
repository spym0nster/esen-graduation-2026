// ProgrammeSection.tsx – Updated timeline layout
"use client";

import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { programmeItems } from "../../data/programme";
import { GlassCard } from "../ui/GlassCard";


// Animation variants for odd/even items
const oddVariant = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const evenVariant = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function ProgrammeSection() {
  const t = useTranslations("programme");
  const locale = useLocale();
  return (
    <section id="programme" className="relative w-full py-[clamp(80px,10vw,160px)] px-4 bg-[var(--color-bg-primary)] flex flex-col items-center overflow-hidden">
      {/* Header */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={{
          hidden: { opacity: 0, y: 24 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
        }}
        className="text-center mb-16 md:mb-24"
      >
        <div className="font-sans uppercase tracking-[0.15em] text-[13px] text-[var(--color-gold-primary)] mb-4">
          {t("eyebrow")}
        </div>
        <h2 className="font-display text-[clamp(32px,4vw,60px)] text-white text-glow-gold">
          {t("title")}
        </h2>
      </motion.div>

      {/* Timeline container */}
      <div className="relative w-full max-w-[900px] mx-auto">
        {/* Central axis – desktop */}
        <div className="hidden md:block absolute inset-y-0 left-1/2 w-[2px] bg-gradient-to-b from-[var(--color-blue-primary)] via-[var(--color-gold-primary)] to-[var(--color-blue-primary)] -translate-x-1/2" />
        {/* Axis for mobile */}
        <div className="block md:hidden absolute inset-y-0 left-[20px] w-[2px] bg-gradient-to-b from-[var(--color-blue-primary)] via-[var(--color-gold-primary)] to-[var(--color-blue-primary)]" />

        <div className="flex flex-col gap-12">
          {programmeItems.map((item, index) => {
            const isOdd = index % 2 !== 0; // true for odd positions to render right side
            const title = locale === "fr" ? item.titleFr : item.title;
            const desc = locale === "fr" ? item.descriptionFr : item.description;
            return (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={isOdd ? oddVariant : evenVariant}
                className="relative md:grid md:grid-cols-[1fr_48px_1fr] md:items-center md:gap-6"
              >
                {/* Desktop layout */}
                <div className="hidden md:grid col-span-3" style={{ gridTemplateColumns: "1fr 48px 1fr" }}>
                  {/* Alternate left/right */}
                  { !isOdd ? (
                    <>
                      {/* Left content */}
                      <div className="flex flex-col items-start pl-4 col-start-1">
                        <GlassCard
                          className={`p-6 transition-all duration-200 group-hover:border-[var(--color-gold-primary)] group-hover:bg-[rgba(201,150,12,0.08)] ${item.highlight ? "border-l-4 border-[var(--color-gold-primary)]" : ""}`}
                        >
                          <h3 className={`font-serif text-[clamp(20px,2vw,24px)] font-semibold leading-snug ${item.highlight ? "text-[var(--color-gold-primary)]" : "text-white"}`}>
                            {title}
                          </h3>
                          {desc && <p className="mt-2 text-[var(--color-off-white)] opacity-75 text-[14px]">{desc}</p>}
                        </GlassCard>
                      </div>
                      {/* Dot */}
                      <div className="flex items-center justify-center col-start-2">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--color-gold-primary)] bg-[var(--color-blue-primary)] shadow-[0_0_12px_rgba(27,58,140,0.5),_0_0_6px_rgba(240,180,41,0.4)]" />
                      </div>
                      {/* Time on right */}
                      <div className="flex flex-col items-end pr-4 col-start-3">
                        <span className="font-sans text-[13px] uppercase tracking-[0.12em] text-[var(--color-gold-primary)]">{item.time}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Time on left */}
                      <div className="flex flex-col items-start pl-4 col-start-1">
                        <span className="font-sans text-[13px] uppercase tracking-[0.12em] text-[var(--color-gold-primary)]">{item.time}</span>
                      </div>
                      {/* Dot */}
                      <div className="flex items-center justify-center col-start-2">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--color-gold-primary)] bg-[var(--color-blue-primary)] shadow-[0_0_12px_rgba(27,58,140,0.5),_0_0_6px_rgba(240,180,41,0.4)]" />
                      </div>
                      {/* Right content */}
                      <div className="flex flex-col items-end pr-4 col-start-3">
                        <GlassCard
                          className={`p-6 transition-all duration-200 group-hover:border-[var(--color-gold-primary)] group-hover:bg-[rgba(201,150,12,0.08)] ${item.highlight ? "border-l-4 border-[var(--color-gold-primary)]" : ""}`}
                        >
                          <h3 className={`font-serif text-[clamp(20px,2vw,24px)] font-semibold leading-snug ${item.highlight ? "text-[var(--color-gold-primary)]" : "text-white"}`}>
                            {title}
                          </h3>
                          {desc && <p className="mt-2 text-[var(--color-off-white)] opacity-75 text-[14px]">{desc}</p>}
                        </GlassCard>
                      </div>
                    </>
                  )}
                </div>

                {/* Mobile layout – single column */}
                <div className="md:hidden flex items-start col-span-3">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--color-gold-primary)] bg-[var(--color-blue-primary)] mr-2 shadow-[0_0_12px_rgba(27,58,140,0.5),_0_0_6px_rgba(240,180,41,0.4)]" />
                      <span className="font-sans text-[13px] uppercase tracking-[0.12em] text-[var(--color-gold-primary)]">{item.time}</span>
                    </div>
                    <GlassCard
                      className={`p-6 transition-all duration-300 group-hover:border-[var(--color-gold-primary)] group-hover:bg-[rgba(201,150,12,0.08)] ${item.highlight ? "border-l-4 border-[var(--color-gold-primary)]" : ""}`}
                    >
                      <h3 className={`font-serif text-[clamp(20px,2vw,24px)] font-semibold leading-snug ${item.highlight ? "text-[var(--color-gold-primary)]" : "text-white"}`}> {title} </h3>
                      {desc && <p className="mt-2 text-[var(--color-off-white)] opacity-75 text-[14px]">{desc}</p>}
                    </GlassCard>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
