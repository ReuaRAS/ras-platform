"use client";

import { useCallback, useEffect, useState } from "react";

export type FieldNameSets = {
  first: string[];
  family: string[];
  nickname: string[];
};

type Generated = { full: string; nickname: string };

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export default function FieldNameGenerator({ sets }: { sets: FieldNameSets }) {
  const [count, setCount] = useState(5);
  const [withNickname, setWithNickname] = useState(true);
  const [names, setNames] = useState<Generated[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = useCallback(() => {
    const next: Generated[] = [];
    const seen = new Set<string>();
    let guard = 0;
    while (next.length < count && guard < 200) {
      guard += 1;
      const full = `${pick(sets.first)} ${pick(sets.family)}`;
      if (seen.has(full)) continue;
      seen.add(full);
      next.push({ full, nickname: withNickname ? pick(sets.nickname) : "" });
    }
    setNames(next);
  }, [count, withNickname, sets]);

  useEffect(() => {
    generate();
  }, [generate]);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-panel flex flex-wrap items-end gap-3 rounded-2xl p-4">
        <label className="flex flex-col gap-1 text-[11px] text-[#94a3b8]">
          عدد الأسماء
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="rounded-xl border border-white/10 bg-[#0b0b0c] px-3 py-2 text-xs text-white"
          >
            {[3, 5, 8, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-[11px]">
          <input
            type="checkbox"
            checked={withNickname}
            onChange={(e) => setWithNickname(e.target.checked)}
          />
          إضافة كنية ميدانية
        </label>

        <button type="button" onClick={generate} className="btn btn-primary text-xs">
          توليد أسماء جديدة
        </button>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {names.map((item) => (
          <li
            key={item.full}
            className="glass-card flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
          >
            <div>
              <p className="text-sm font-extrabold">{item.full}</p>
              {item.nickname ? (
                <p className="text-[10px] text-[#94a3b8]">الكنية: {item.nickname}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => copy(item.full)}
              className="rounded-lg border border-white/10 px-2.5 py-1 text-[10px] font-bold text-[#94a3b8] hover:bg-white/5 hover:text-white"
            >
              {copied === item.full ? "تم النسخ" : "نسخ"}
            </button>
          </li>
        ))}
      </ul>

      <p className="text-[10px] leading-relaxed text-[#64748b]">
        الأسماء للاستخدام داخل السيرفر (RP). أعد التوليد للحصول على تشكيلة جديدة، ولا تُستخدم الأسماء
        لأي غرض خارج اللعبة.
      </p>
    </div>
  );
}
