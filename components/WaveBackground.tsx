"use client";

import { useEffect, useRef } from "react";

/**
 * خلفية الموج — 3 طبقات متحركة أسفل الشاشة (35% من الارتفاع).
 *
 * الأداء: الرسم محدود بـ 30 إطارًا/ثانية، ولون القطاع يُقرأ مرة واحدة بدل
 * استدعاء getComputedStyle داخل كل إطار (كان يسبب إعادة حساب تنسيقات كاملة
 * 60 مرة/ثانية فيتجمّد التمرير على الجوال). يتوقف الرسم عند إخفاء التبويب
 * أو عند تفعيل تقليل الحركة.
 */
export default function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let t = 0;
    let last = 0;
    let width = 0;
    let height = 0;

    const layers = [
      { alpha: 0.3, amp: 22, freq: 0.0045, speed: 0.55, offset: 0.62 },
      { alpha: 0.25, amp: 30, freq: 0.0032, speed: 0.35, offset: 0.72 },
      { alpha: 0.2, amp: 38, freq: 0.0021, speed: 0.22, offset: 0.82 },
    ];

    // لون القطاع الحالي (fallback: أحمر الهلال)
    let rgb: [number, number, number] = [198, 40, 40];
    const readSectorRgb = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--sector-main")
        .trim();
      const hex = raw.replace("#", "");
      if (hex.length === 6) {
        rgb = [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16),
        ];
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const paint = () => {
      ctx.clearRect(0, 0, width, height);
      const [r, g, b] = rgb;

      for (const layer of layers) {
        ctx.beginPath();
        const baseY = height * layer.offset;
        ctx.moveTo(0, height);
        // خطوة 14px تكفي بصريًا وتخفض عدد النقاط إلى أقل من النصف.
        for (let x = 0; x <= width; x += 14) {
          const y =
            baseY +
            Math.sin(x * layer.freq + t * layer.speed) * layer.amp +
            Math.sin(x * layer.freq * 2.3 + t * layer.speed * 1.4) * (layer.amp / 3);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${layer.alpha})`;
        ctx.fill();
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      // 30fps كافية لموجة ناعمة وتوفّر نصف عمل المعالج.
      if (now - last < 33) return;
      t += (now - last) * 0.06;
      last = now;
      paint();
    };

    resize();
    readSectorRgb();
    paint();

    const onResize = () => {
      resize();
      paint();
    };
    window.addEventListener("resize", onResize);

    // إعادة قراءة اللون فقط عند تغيّر سمة <html> (تبديل القطاع).
    const observer = new MutationObserver(readSectorRgb);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class"] });

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!reduceMotion && !raf) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (!reduceMotion) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
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
