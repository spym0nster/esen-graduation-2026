import { GlassCard } from "./GlassCard";

interface CountdownBoxProps {
  value: number;
  label: string;
}

export function CountdownBox({ value, label }: CountdownBoxProps) {
  return (
    <GlassCard className="flex flex-col items-center justify-center p-4 w-[clamp(120px,18vw,180px)] h-[clamp(120px,18vw,180px)] rounded-[8px]">
      <div className="font-display text-[clamp(60px,10vw,100px)] leading-none text-white text-glow-gold relative">
        {value.toString().padStart(2, "0")}
      </div>
      <div className="font-sans uppercase tracking-[0.15em] text-[12px] text-[#8A6A1A] mt-2">
        {label}
      </div>
    </GlassCard>
  );
}
