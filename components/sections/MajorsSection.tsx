"use client";

import { motion } from "framer-motion";
import { majors } from "../../data/majors";
import { GlassCard } from "../ui/GlassCard";

export function MajorsSection() {
  return (
    <section id="majors" className="relative w-full py-[clamp(80px,10vw,160px)] bg-[#0D0B0E] overflow-hidden">
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
        <div className="font-sans uppercase tracking-[0.15em] text-[13px] text-[#8A6A1A] mb-4">
          CLASS OF 2026
        </div>
        <h2 className="font-display text-[clamp(32px,4vw,60px)] text-white text-glow-gold">
          Our Graduating Majors
        </h2>
      </motion.div>

      <div className="w-full px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-6 pb-8 snap-x snap-mandatory md:snap-none hide-scrollbar">
          {majors.map((major, index) => (
            <motion.div
              key={major.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] as any } }
              }}
              className="min-w-[280px] w-[80vw] md:w-auto snap-center group flex-shrink-0"
            >
              <GlassCard className="h-full p-8 flex flex-col items-center justify-center text-center transition-all duration-300 group-hover:-translate-y-2 relative overflow-hidden">
                {(major as any).imageUrl && (
                  <div 
                    className="w-[100px] h-[100px] mb-5 rounded-full bg-cover bg-center border-2 border-[#C9960C] shadow-[0_0_15px_rgba(201,150,12,0.3)]" 
                    style={{ backgroundImage: `url('${(major as any).imageUrl}')` }} 
                  />
                )}
                <h3 className="font-serif text-[clamp(22px,2.5vw,28px)] text-[#E8E0D0] mb-2 leading-tight">
                  {major.name}
                </h3>
                <p className="font-sans text-[14px] text-[#8A6A1A] mb-2">
                  {major.description}
                </p>
                {(major as any).score && (
                  <div className="mt-2 inline-block px-4 py-1.5 bg-[rgba(201,150,12,0.08)] border border-[rgba(201,150,12,0.3)] rounded-full text-[#F0C040] font-sans text-xs font-semibold tracking-widest">
                    SCORE: {(major as any).score}
                  </div>
                )}
                {/* Thin gold bottom border */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9960C] to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-300" />
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
