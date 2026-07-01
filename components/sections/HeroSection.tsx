"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { GoldButton } from "../ui/GoldButton";
import { ParticleField } from "../ui/ParticleField";
import { HERO_IMAGE } from "@/lib/images";

export function HeroSection({ introComplete }: { introComplete: boolean }) {
  const t = useTranslations("Global");
  const th = useTranslations("hero");
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) setHasScrolled(true);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!introComplete) return <section className="h-screen w-full bg-black" />;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  return (
    <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{ scale: [1, 1.1] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        >
          <Image
            src={HERO_IMAGE}
            alt=""
            width={2560}
            height={1707}
            priority
            quality={85}
            sizes="100vw"
            className="h-full w-full object-cover object-center"
            style={{ backgroundColor: "#1A1410" }}
          />
        </motion.div>
      </div>

      {/* Warm brown overlay */}
      <div className="absolute inset-0 z-0 bg-[var(--color-overlay)]" />

      {/* Dual ambient glows */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Left blue glow */}
        <div className="absolute left-0 top-0 w-1/2 h-full"
          style={{
            background: "radial-gradient(ellipse 40% 50% at 20% 50%, bg-[var(--color-blue-muted)], transparent 70%)",
          }}
        />
        {/* Right gold glow */}
        <div className="absolute right-0 top-0 w-1/2 h-full"
          style={{
            background: "radial-gradient(ellipse 40% 50% at 80% 50%, bg-[var(--color-gold-muted)], transparent 70%)",
          }}
        />
      </div>

      <ParticleField />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="font-sans uppercase tracking-[0.15em] text-[13px] text-[var(--foreground)] mb-6">
          ESEN · {t("classOf")}
        </motion.div>

        <motion.h1 className="font-display text-[clamp(56px,8vw,120px)] leading-[0.9] tracking-[-0.02em] text-[#FFFFFF]" variants={itemVariants}>
          <span className="text-[#FFFFFF]" style={{ textShadow: "0 0 60px rgba(27,58,140,0.6), 0 0 120px rgba(27,58,140,0.2)" }}>ESEN</span>
          <br />
          <motion.span
            className="text-[var(--color-gold-primary)] text-glow-gold"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
            }}
            initial="hidden"
            animate="visible"
          >
            GRADUATION CEREMONY
          </motion.span>
        </motion.h1>

        <motion.p
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0.7, delay: 0.7 } },
          }}
          initial="hidden"
          animate="visible"
          className="font-serif text-[#F5ECD7] text-[clamp(20px,3vw,32px)] mt-8 max-w-2xl uppercase tracking-[0.2em]"
        >
          {t("tagline")}
        </motion.p>

        {/* Date bar */}
        <motion.div
          className="flex items-center gap-4 mt-12 font-sans text-sm tracking-widest uppercase text-[var(--foreground)]"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0.7, delay: 0.9 } },
          }}
          initial="hidden"
          animate="visible"
        >
          <span>{th("date")}</span>
          <div className="h-[12px] w-[1px] bg-gradient-to-b from-transparent via-[#F0B429] to-transparent" />
          <a href="https://maps.google.com/?q=UTICA+Tunis+Tunisia" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none", borderBottom: "1px solid rgba(240,180,41,0.40)", paddingBottom: "1px", transition: "border-color 0.3s" }}>UTICA</a>
          <div className="h-[12px] w-[1px] bg-gradient-to-b from-transparent via-[#F0B429] to-transparent" />
          <span>16:00</span>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-6 mt-12"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0.7, delay: 1.1 } },
          }}
          initial="hidden"
          animate="visible"
        >
          <GoldButton
            variant="primary"
            onClick={() => {
              const el = document.getElementById('rsvp');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {th("cta")}
          </GoldButton>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      {!hasScrolled && (
        <motion.div
          className="absolute bottom-10 z-10 w-[1px] h-[60px] bg-gradient-to-b from-[#F0B429] to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0], y: [0, 10, 20] }}
          transition={{ duration: 2, repeat: Infinity, delay: 2 }}
        />
      )}
    </section>
  );
}
