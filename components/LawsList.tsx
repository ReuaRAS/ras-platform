"use client";

import { useMemo, useState } from "react";
import type { Law } from "@/lib/types";

export default function LawsList({ laws }: { laws: Law[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "main" | "common">("all");

  const filtered = useMemo(() => {
    const q = query.trim();
    return laws.filter((law) => {
      if (category !== "all" && (law.category ?? "main") !== category) return false;
      if (!q) return true;
      const haystack = `${law.law_code} ${law.title} ${law.penalty} ${law.notes ?? ""}`;
      return haystack.includes(q);
    });
  }, [laws, query, category]);

  const mainCount = laws.filter((l) => (l.category ?? "main") === "main").length;
  const commonCount = laws.length - mainCount;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في القوانين… (مثال: إهمال، راديو، 500,000)"
            className="field pr-10"
            aria-label="بحث في القوانين"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#64748b]">
            🔍
          </span>
        </div>
        <div className="flex gap-1">
          {[
            { key: "all", label: `الكل (${laws.length})` },
            { key: "main", label: `رئيسية (${mainCount})` },
            { key: "common", label: `شائعة (${commonCount})` },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setCategory(f.key as "all" | "main" | "common")}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                category === f.key
                  ? "sector-gradient text-white"
                  : "border border-white/10 bg-white/5 text-[#94a3b8] hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="glass-panel rounded-2xl p-8 text-center text-sm text-[#94a3b8]">
          لا توجد نتائج مطابقة.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((law) => (
            <article key={law.id} className="glass-card glass-card-hover rounded-2xl p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--sector-main)_20%,transparent)] px-1.5 text-[11px] font-black text-[var(--sector-light)]">
                    #{law.law_code.replace(/\D/g, "").slice(-2)}
                  </span>
                  <h3 className="text-sm font-extrabold leading-snug">{law.title}</h3>
                </div>
                {(law.category ?? "main") === "common" && (
                  <span className="badge badge-warn shrink-0">شائعة</span>
                )}
              </div>

              <p className="text-xs font-bold text-[#f9a825]">
                <span aria-hidden="true">💰</span> {law.penalty}
              </p>

              {law.additional_penalty && (
                <p className="mt-1 text-[11px] text-[#94a3b8]">{law.additional_penalty}</p>
              )}
              {law.notes && (
                <p className="mt-2 rounded-lg bg-black/30 px-2.5 py-1.5 text-[11px] leading-relaxed text-[#94a3b8]">
                  {law.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
