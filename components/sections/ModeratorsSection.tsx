"use client";

import { motion } from "framer-motion";
import { moderators } from "../../data/moderators";
import { PersonCard } from "../ui/PersonCard";

export function ModeratorsSection() {
  return (
    <section className="relative w-full py-[clamp(80px,10vw,160px)] bg-[var(--color-bg-primary)] overflow-hidden">
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
          YOUR HOSTS FOR THE EVENING
        </div>
        <h2 className="font-display text-[clamp(32px,4vw,60px)] text-white text-glow-gold">
          Masters of Ceremony
        </h2>
      </motion.div>

      <div className="w-full max-w-5xl mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12"
        >
          {moderators.map((mod) => (
            <motion.div
              key={mod.id}
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as any } }
              }}
            >
              <PersonCard 
                name={mod.name} 
                role={mod.role} 
                imageUrl={mod.imageUrl} 
                size="large" 
                imagePosition={(mod as any).imagePosition}
                imageSizeOffset={(mod as any).imageSizeOffset}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
