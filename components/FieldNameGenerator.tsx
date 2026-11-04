"use client";

import { useCallback, useEffect, useState } from "react";
import { CALLSIGNS, FAMILY_NAMES, FIRST_NAMES } from "@/content/tools/field-names";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function FieldNameGenerator() {
  const [name, setName] = useState("");
  const [withNumber, setWithNumber] = useState(true);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    const full = `${pick(FIRST_NAMES)} ${pick(FAMILY_NAMES)}`;
    setName(withNumber ? `${full} ${pick(CALLSIGNS)}` : full);
    setCopied(false);
  }, [withNumber]);

  useEffect(() => {
    generate();
  }, [generate]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(name);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-10 text-center">
        <p className="text-[11px] text-[#94a3b8]">الاسم الميداني المقترح</p>
        <p className="mt-2 text-2xl font-black sm:text-3xl">{name || "—"}</p>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-[#94a3b8]">
        <input
          type="checkbox"
          checked={withNumber}
          onChange={(e) => {
            setWithNumber(e.target.checked);
            setCopied(false);
          }}
          className="h-4 w-4 accent-[#c62828]"
        />
        إضافة رقم ميداني (Callsign)
      </label>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={generate} className="btn btn-primary text-xs">
          🎲 اسم جديد
        </button>
        <button type="button" onClick={copy} className="btn btn-ghost text-xs">
          {copied ? "✅ تم النسخ" : "📋 نسخ"}
        </button>
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-[#64748b]">
        ملاحظة: الأسماء المولّدة مقترحات عامة من بنك كلمات ثابت. الاسم النهائي يجب أن يطابق
        اسمك في ديسكورد حسب قوانين القطاع.
      </p>
    </div>
  );
}
