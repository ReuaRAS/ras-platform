"use client";

import { useEffect, useRef } from "react";

/**
 * خلفية الموج — 3 طبقات متحركة أسفل الشاشة (35% من الارتفاع).
 * مأخوذة من تصميم index.html القديم، مكتوبة بـ TypeScript + Canvas API.
 */
export default function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let t = 0;

    // لون القطاع الحالي (fallback: أحمر الهلال)
    const readSectorRgb = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--sector-main")
        .trim();
      const hex = raw.replace("#", "");
      if (hex.length === 6) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16),
        ] as const;
      }
      return [198, 40, 40] as const;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const layers = [
      { alpha: 0.3, amp: 22, freq: 0.0045, speed: 0.00055, offset: 0.62 },
      { alpha: 0.25, amp: 30, freq: 0.0032, speed: 0.00035, offset: 0.72 },
      { alpha: 0.2, amp: 38, freq: 0.0021, speed: 0.00022, offset: 0.82 },
    ];

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      const [r, g, b] = readSectorRgb();

      for (const layer of layers) {
        ctx.beginPath();
        const baseY = h * layer.offset;
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 6) {
          const y =
            baseY +
            Math.sin(x * layer.freq + t * layer.speed * 1000) * layer.amp +
            Math.sin(x * layer.freq * 2.3 + t * layer.speed * 1400) * (layer.amp / 3);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${layer.alpha})`;
        ctx.fill();
      }

      t += reduceMotion ? 0 : 16;
      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-[35vh] overflow-hidden"
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
