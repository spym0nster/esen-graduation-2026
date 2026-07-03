import { useEffect, useRef, useState } from "react";

// Smoothly tweens a displayed number toward `target` (easeOutCubic).
// No animation on first mount; only when the value actually changes.
export function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(target);
  const displayed = useRef(target);

  useEffect(() => {
    const from = displayed.current;
    const to = target;
    if (from === to) return;
    let raf = 0;
    let start: number | null = null;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = Math.round(from + (to - from) * eased);
      displayed.current = cur;
      setVal(cur);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
}
