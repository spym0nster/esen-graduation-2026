// Lightweight, dependency-free confetti burst. Safe to call from client components.
export function fireConfetti(durationMs = 2600): void {
  if (typeof document === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:99999";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) { canvas.remove(); return; }
  ctx.scale(dpr, dpr);

  const W = window.innerWidth;
  const H = window.innerHeight;
  const colors = ["#F0B429", "#1B3A8C", "#34D399", "#FFFFFF", "#60a5fa", "#FFD166"];

  type P = { x: number; y: number; vx: number; vy: number; g: number; size: number; color: string; rot: number; vr: number };
  const make = (originX: number): P[] =>
    Array.from({ length: 90 }, () => {
      const angle = (Math.random() - 0.5) * Math.PI * 0.9 - Math.PI / 2;
      const speed = 8 + Math.random() * 10;
      return {
        x: originX,
        y: H + 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        g: 0.28 + Math.random() * 0.18,
        size: 5 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
      };
    });

  // Two cannons from the bottom corners.
  const parts: P[] = [...make(W * 0.15), ...make(W * 0.85)];

  let start: number | null = null;
  const frame = (t: number) => {
    if (start === null) start = t;
    const elapsed = t - start;
    ctx.clearRect(0, 0, W, H);
    const alpha = Math.max(0, 1 - elapsed / durationMs);
    for (const p of parts) {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
      ctx.restore();
    }
    if (elapsed < durationMs) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
