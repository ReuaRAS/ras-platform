"use client";

import { useEffect, useState } from "react";

/**
 * نافذة ديسكورد — تُستخدم لعرض رابط السيرفر ونسخ معرّف اللاعب
 * (نقلًا عن DiscordModal في index.html القديم).
 */
export default function DiscordModal({
  open,
  onClose,
  invite = "https://discord.gg/RAS",
}: {
  open: boolean;
  onClose: () => void;
  invite?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(invite);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="glass-card w-full max-w-md rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="سيرفر ديسكورد"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">
            💬
          </span>
          <div>
            <h2 className="text-lg font-extrabold">سيرفر محافظة الرس</h2>
            <p className="text-xs text-[#94a3b8]">انضم للسيرفر لاستلام التوزيع والتواصل</p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center text-sm break-all">
          {invite}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <a href={invite} target="_blank" rel="noreferrer" className="btn btn-primary flex-1">
            فتح ديسكورد
          </a>
          <button type="button" onClick={copyInvite} className="btn btn-ghost flex-1">
            {copied ? "✅ تم النسخ" : "نسخ الرابط"}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-center text-xs text-[#94a3b8] hover:text-white"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}
