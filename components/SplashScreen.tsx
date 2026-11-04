"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ras-splash-shown";

/** شاشة البداية — تظهر مرة واحدة لكل جلسة، مع زر تخطي. */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    setVisible(true);
    const timer = setTimeout(() => dismiss(), 2600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    setLeaving(true);
    sessionStorage.setItem(STORAGE_KEY, "1");
    setTimeout(() => setVisible(false), 450);
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0d0d0d] transition-opacity duration-500 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="animate-fade-up flex flex-col items-center gap-5 px-6 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-[#c62828]/15 text-5xl">
          <span aria-hidden="true">🛡️</span>
          <span className="absolute inset-0 rounded-3xl border border-[#c62828]/40 animate-pulse-ring" />
        </div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          منصة <span className="gold-text">قطاعات</span> محافظة الرس
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-[#94a3b8]">
          أكاديمية الرس الذكية — قوانين، توظيف، دورات، مكافآت وشهادات معتمدة لكل قطاع.
        </p>
        <button type="button" onClick={dismiss} className="btn btn-ghost mt-2 text-sm">
          تخطي
        </button>
      </div>
      <p className="absolute bottom-8 text-xs text-[#64748b]">
        © 2026 NJM — جميع الحقوق محفوظة
      </p>
    </div>
  );
}
