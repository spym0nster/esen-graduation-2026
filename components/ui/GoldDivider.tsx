import { motion } from "framer-motion";

export function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <motion.div 
      initial={{ width: 0 }}
      whileInView={{ width: "100%" }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`max-w-[140px] mx-auto h-[1px] opacity-70 ${className}`} 
      style={{ background: 'linear-gradient(90deg, var(--color-blue-primary), var(--color-gold-primary), var(--color-blue-primary))' }} 
    />
  );
}
