"use client";

import { useEffect, useState } from "react";

/** عدّاد تنازلي للفعاليات (نقلًا عن EventCountdown في events.html القديم). */
export default function EventCountdown({
  target,
  label = "يبدأ خلال",
}: {
  target: string;
  label?: string;
}) {
  const [diff, setDiff] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setDiff(new Date(target).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (diff === null) return null;

  if (diff <= 0) {
    return (
      <span className="badge badge-muted">انتهت الفعالية</span>
    );
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const parts = [
    { value: days, label: "يوم" },
    { value: hours, label: "ساعة" },
    { value: minutes, label: "دقيقة" },
    { value: seconds, label: "ثانية" },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#94a3b8]">{label}</span>
      <div className="flex gap-1" dir="ltr">
        {parts.map((p) => (
          <span
            key={p.label}
            className="flex min-w-10 flex-col items-center rounded-lg bg-black/40 px-1.5 py-1"
          >
            <span className="font-mono text-xs font-black text-[#f9a825]">
              {String(p.value).padStart(2, "0")}
            </span>
            <span className="text-[8px] text-[#64748b]">{p.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
