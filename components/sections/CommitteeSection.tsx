"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { committee } from "../../data/committee";
import { PersonCard } from "../ui/PersonCard";

export function CommitteeSection() {
  const t = useTranslations("committee");
  return (
    <section id="committee" className="relative w-full py-[clamp(80px,10vw,160px)] bg-[var(--color-bg-secondary)] overflow-hidden">
      {/* Subtle border top to separate from previous section */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-gold-primary)] to-transparent" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={{
          hidden: { opacity: 0, y: 24 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.7 } }
        }}
        className="text-center mb-16 md:mb-24 px-4"
      >
        <div className="font-sans uppercase tracking-[0.15em] text-[13px] text-[var(--color-gold-primary)] mb-4">
          {t("eyebrow")}
        </div>
        <h2 className="font-display text-[clamp(32px,4vw,60px)] text-white text-glow-gold">
          {t("title")}
        </h2>
      </motion.div>

      <div className="w-full max-w-6xl mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10"
        >
          {committee.map((member) => (
            <motion.div
              key={member.id}
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
              }}
            >
              <PersonCard
                name={member.name}
                role={member.role}
                imageUrl={member.imageUrl}
                size="medium"
                imagePosition={(member as { imagePosition?: string; imageSizeOffset?: string }).imagePosition}
                imageSizeOffset={(member as { imagePosition?: string; imageSizeOffset?: string }).imageSizeOffset}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
