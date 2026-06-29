"use client";

import { motion } from "framer-motion";

const title = "DJ WOLF";
const letters = title.split("");

const container = {
  hidden: { opacity: 0 },
  visible: (i = 1) => ({
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.4 * i },
  }),
};

const child = {
  hidden: {
    opacity: 0,
    filter: "blur(20px)",
    scale: 1.2,
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: {
      type: "spring" as const,
      damping: 12,
      stiffness: 100,
    },
  },
};

const Equalizer = () => (
  <div className="flex items-end justify-center gap-[4px] h-[40px] mt-12">
    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
      <motion.div
        key={i}
        className="w-[3px] bg-gradient-to-t from-transparent via-[#C9960C] to-[#F0C040]"
        animate={{ 
          height: [`${Math.random() * 20 + 10}px`, "40px", `${Math.random() * 15 + 5}px`] 
        }}
        transition={{ 
          duration: 0.6 + (i % 3) * 0.2, 
          repeat: Infinity, 
          repeatType: "reverse", 
          ease: "easeInOut",
          delay: i * 0.1
        }}
      />
    ))}
  </div>
);

export function SpecialGuestSection() {
  return (
    <section className="relative w-full py-[clamp(120px,15vw,200px)] bg-[#0D0B0E] overflow-hidden flex flex-col items-center justify-center min-h-[80vh]">
      {/* Dramatic gold radial glow */}
      <motion.div 
        className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full bg-[radial-gradient(circle_at_center,rgba(201,150,12,0.15)_0%,transparent_70%)] blur-[60px]" />
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="relative z-10 text-center w-full px-4"
      >
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
          }}
          className="font-sans uppercase tracking-[0.2em] text-[14px] text-[#F0C040] mb-8"
        >
          CLOSING ACT · SPECIAL GUEST
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex justify-center mb-6"
        >
          {letters.map((letter, index) => (
            <motion.span
              key={index}
              variants={child}
              className="font-display text-[clamp(60px,12vw,140px)] leading-none text-transparent bg-clip-text bg-gradient-to-b from-[#FFF] via-[#F0C040] to-[#C9960C] drop-shadow-[0_0_20px_rgba(201,150,12,0.5)] mr-[2vw] last:mr-0"
              style={{ paddingBottom: '0.1em' }}
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          ))}
        </motion.div>

        <motion.p
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 1, delay: 1.2 } }
          }}
          className="font-serif italic text-[#E8E0D0] text-[clamp(20px,2.5vw,28px)]"
        >
          Closing the night with an unforgettable set
        </motion.p>

        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 1, delay: 1.5 } }
          }}
        >
          <Equalizer />
        </motion.div>
      </motion.div>
    </section>
  );
}
