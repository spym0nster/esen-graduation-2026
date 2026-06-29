import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div className={`glass-panel rounded-[12px] ${className}`.trim()}>
      {children}
    </div>
  );
}
