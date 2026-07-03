import { useEffect, useRef, useState } from "react";
import { fireConfetti } from "@/lib/celebrate";

const STEP = 50; // celebrate every 50 people inside

// Fires confetti + returns a temporary banner message when a milestone is crossed
// (every 50 people, and "salle complète" when everyone expected is inside).
export function useCelebrate(inside: number, full: boolean): string | null {
  const [banner, setBanner] = useState<string | null>(null);
  const prev = useRef<number | null>(null);
  const fullDone = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Seed on first real value so we don't fire on initial load.
    if (prev.current === null) { prev.current = inside; return; }

    let msg: string | null = null;
    if (inside > 0 && Math.floor(inside / STEP) > Math.floor(prev.current / STEP)) {
      msg = `🎉 ${Math.floor(inside / STEP) * STEP} personnes à l'intérieur !`;
    }
    if (full && !fullDone.current) {
      fullDone.current = true;
      msg = "🎉 Salle complète !";
    }
    prev.current = inside;

    if (msg) {
      setBanner(msg);
      fireConfetti();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setBanner(null), 5500);
    }
  }, [inside, full]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return banner;
}
