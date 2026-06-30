"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { CountdownBox } from "../ui/CountdownBox";

// Ceremony start: 9 July 2026, 16:00 Tunisia time (UTC+1, no DST).
const TARGET = new Date("2026-07-09T16:00:00+01:00").getTime();

function calc() {
  const diff = Math.max(0, TARGET - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export function CountdownSection() {
  const t = useTranslations("countdown");
  // mounted guard keeps SSR and first client render identical (zeros) → no hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setMounted(true);
    setTime(calc());
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  const boxes = [
    { value: time.days, label: t("days") },
    { value: time.hours, label: t("hours") },
    { value: time.minutes, label: t("minutes") },
    { value: time.seconds, label: t("seconds") },
  ];

  return (
    <section
      id="countdown"
      className="relative py-24 px-4"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 30%, #0F2560 0%, #1C0F06 70%)" }}
    >
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true, margin: "-80px" }}
      >
        <p className="text-xs uppercase tracking-[0.18em] text-[#F0B429] mb-3">{t("eyebrow")}</p>
        <h2 className="font-display text-4xl md:text-5xl text-white">{t("title")}</h2>
        <div className="mx-auto mt-4 h-px w-32" style={{ background: "linear-gradient(90deg,#1B3A8C,#F0B429,#1B3A8C)" }} />
      </motion.div>

      <div className="flex flex-wrap justify-center gap-4 md:gap-6">
        {boxes.map((b) => (
          <CountdownBox key={b.label} value={mounted ? b.value : 0} label={b.label} />
        ))}
      </div>
    </section>
  );
}
