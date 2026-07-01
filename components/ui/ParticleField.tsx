"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  xDrift: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export function ParticleField() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage
      xDrift: (Math.random() - 0.5) * 5, // horizontal drift in vw (precomputed for render purity)
      size: Math.random() * 3 + 2, // 2-5px
      duration: Math.random() * 10 + 10, // 10-20s
      delay: Math.random() * 5, // 0-5s delay
      opacity: Math.random() * 0.2 + 0.3, // 0.3-0.5
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#F0C040]"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            bottom: "-10px",
            boxShadow: "0 0 10px rgba(240,192,64,0.8)",
          }}
          animate={{
            y: ["0vh", "-110vh"],
            x: ["0vw", `${p.xDrift}vw`],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
