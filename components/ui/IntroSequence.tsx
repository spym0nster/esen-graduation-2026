"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function IntroSequence({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const handleSkip = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem("esen_intro_seen", "true");
    setTimeout(onComplete, 800); // Wait for exit animation
  }, [onComplete]);

  useEffect(() => {
    setIsMounted(true);
    const hasSeenIntro = localStorage.getItem("esen_intro_seen");
    if (hasSeenIntro) {
      setIsVisible(false);
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      handleSkip();
    }, 2500);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleSkip();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSkip, onComplete]);

  if (!isMounted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0B0E] cursor-pointer"
          onClick={handleSkip}
          exit={{ y: "-100%", opacity: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }}
        >
          {/* Subtle golden light bloom */}
          <motion.div
            className="absolute w-[40vw] h-[40vw] rounded-full bg-[rgba(201,150,12,0.15)] blur-[100px]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
          />

          <motion.h1
            className="font-display text-white text-[clamp(60px,10vw,140px)] leading-none tracking-[-0.02em] z-10"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            ESEN
          </motion.h1>

          <motion.div
            className="font-serif text-[#E8E0D0] text-[clamp(16px,2vw,24px)] tracking-[0.2em] uppercase mt-4 z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
          >
            Graduation Ceremony 2026
          </motion.div>
          
          <div className="absolute bottom-10 font-sans text-xs uppercase tracking-widest text-[#8A6A1A] opacity-50">
            Click or press ESC to skip
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
