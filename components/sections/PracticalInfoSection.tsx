"use client";

import { motion } from "framer-motion";
import { MapPin, Calendar, Star } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";

export function PracticalInfoSection() {
  return (
    <section className="relative w-full py-[clamp(80px,10vw,160px)] bg-[#0D0B0E] overflow-hidden">
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
          VENUE INFORMATION
        </div>
        <h2 className="font-display text-[clamp(32px,4vw,60px)] text-white text-glow-gold">
          Getting There
        </h2>
      </motion.div>

      <div className="w-full max-w-6xl mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Location Panel */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as any } }
            }}
          >
            <GlassCard className="h-full p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[rgba(201,150,12,0.1)] flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-[#F0C040]" />
              </div>
              <h3 className="font-serif text-[24px] text-[#E8E0D0] mb-4 font-semibold">
                UTICA
              </h3>
              <p className="font-sans text-[15px] text-[#8A6A1A] mb-6">
                Cité de la Culture, Tunis, Tunisia
              </p>
              <a 
                href="https://maps.google.com/?q=UTICA+Tunis" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-sans text-[13px] uppercase tracking-widest text-[#C9960C] hover:text-[#F0C040] transition-colors border-b border-[rgba(201,150,12,0.3)] hover:border-[#F0C040] pb-1"
              >
                View on Google Maps
              </a>
            </GlassCard>
          </motion.div>

          {/* Date & Time Panel */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as any } }
            }}
          >
            <GlassCard className="h-full p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[rgba(201,150,12,0.1)] flex items-center justify-center mb-6">
                <Calendar className="w-8 h-8 text-[#F0C040]" />
              </div>
              <h3 className="font-serif text-[24px] text-[#E8E0D0] mb-4 font-semibold">
                9 July 2026
              </h3>
              <p className="font-sans text-[15px] text-[#8A6A1A]">
                Doors open at 17:00<br />
                Ceremony begins at 17:00
              </p>
            </GlassCard>
          </motion.div>

          {/* Dress Code Panel */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as any } }
            }}
          >
            <GlassCard className="h-full p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[rgba(201,150,12,0.1)] flex items-center justify-center mb-6">
                <Star className="w-8 h-8 text-[#F0C040]" />
              </div>
              <h3 className="font-serif text-[24px] text-[#E8E0D0] mb-4 font-semibold">
                Dress Code
              </h3>
              <p className="font-sans text-[15px] text-[#8A6A1A]">
                Formal / Academic Attire
              </p>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
