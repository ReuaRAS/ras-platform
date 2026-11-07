"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PublicQuestion, SuspicionFlag } from "@/lib/test-types";
import { AlertTriangle, Timer } from "lucide-react";

function formatTime(seconds: number) {
  const m = Math.floor(Math.max(seconds, 0) / 60);
  const s = Math.max(seconds, 0) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TestRunner({
  questions,
  timeLimitMinutes,
  submitting,
  onSubmit,
}: {
  questions: PublicQuestion[];
  timeLimitMinutes: number;
  submitting: boolean;
  onSubmit: (answers: Map<string, string>, flags: SuspicionFlag[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [remaining, setRemaining] = useState(timeLimitMinutes * 60);
  const [flags, setFlags] = useState<SuspicionFlag[]>([]);
  const submittedRef = useRef(false);

  const current = questions[index];
  const answeredCount = answers.size;

  const submit = useCallback(
    (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      const finalFlags = auto
        ? [...flags, { type: "timeout", at: new Date().toISOString() }]
        : flags;
      onSubmit(answers, finalFlags);
    },
    [answers, flags, onSubmit],
  );

  // المؤقت
  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer);
          submit(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submit]);

  // منع النسخ والقص واللصق والقائمة اليمنى
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "a", "p", "s"].includes(key)) {
        e.preventDefault();
      }
      if (key === "printscreen") {
        e.preventDefault();
      }
    };
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("paste", prevent);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // تسجيل تبديل التبويب / فقدان التركيز (تحذير فقط، بلا إلغاء تلقائي)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && !submittedRef.current) {
        setFlags((f) => [...f, { type: "tab-switch", at: new Date().toISOString() }]);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const warnCount = flags.filter((f) => f.type === "tab-switch").length;
  const progress = useMemo(
    () => Math.round((answeredCount / Math.max(questions.length, 1)) * 100),
    [answeredCount, questions.length],
  );

  if (!current) return null;

  return (
    <div className="no-select mx-auto max-w-3xl">
      {/* الشريط العلوي */}
      <div className="glass-panel mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-extrabold">
            سؤال {index + 1} / {questions.length}
          </span>
          <span className="text-[#94a3b8]">أجبت على {answeredCount}</span>
        </div>
        <div className="flex items-center gap-3">
          {warnCount > 0 && (
            <span className="badge badge-warn" title="يُسجَّل تبديل التبويب في تقرير المشرف">
              <AlertTriangle className="inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" /> {warnCount} تحذير
            </span>
          )}
          <span
            className={`rounded-xl px-3 py-1.5 font-mono text-sm font-black ${
              remaining <= 60
                ? "bg-[#c62828]/20 text-[#f87171]"
                : "bg-black/40 text-[#f9a825]"
            }`}
            aria-live="off"
          >
            <Timer className="inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" /> {formatTime(remaining)}
          </span>
        </div>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[var(--sector-main)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* السؤال */}
      <div className="glass-card rounded-2xl p-6">
        <p className="mb-5 text-base font-extrabold leading-relaxed sm:text-lg">
          {current.question_text}
        </p>

        <div className="space-y-2">
          {current.choices.map((choice, i) => {
            const selected = answers.get(current.id) === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() =>
                  setAnswers((prev) => {
                    const next = new Map(prev);
                    next.set(current.id, choice.id);
                    return next;
                  })
                }
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-right text-sm transition-all ${
                  selected
                    ? "border-[var(--sector-main)] bg-[color-mix(in_srgb,var(--sector-main)_14%,transparent)] font-bold"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]"
                }`}
                aria-pressed={selected}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${
                    selected
                      ? "border-[var(--sector-main)] bg-[var(--sector-main)] text-white"
                      : "border-white/20 text-[#94a3b8]"
                  }`}
                >
                  {["أ", "ب", "ج", "د", "هـ", "و"][i] ?? i + 1}
                </span>
                <span className="leading-relaxed">{choice.choice_text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* التنقل */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          className="btn btn-ghost text-xs"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          → السابق
        </button>

        <div className="flex flex-wrap items-center justify-center gap-1">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`سؤال ${i + 1}`}
              className={`h-6 w-6 rounded-md text-[10px] font-bold transition-colors ${
                i === index
                  ? "bg-[var(--sector-main)] text-white"
                  : answers.has(q.id)
                    ? "bg-[#27ae60]/25 text-[#4ade80]"
                    : "bg-white/5 text-[#94a3b8] hover:bg-white/10"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {index < questions.length - 1 ? (
          <button
            type="button"
            className="btn btn-primary text-xs"
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
          >
            التالي ←
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-gold text-xs"
            onClick={() => submit(false)}
            disabled={submitting}
          >
            {submitting ? "جارٍ التصحيح…" : "تسليم الاختبار"}
          </button>
        )}
      </div>

      {answeredCount < questions.length && index === questions.length - 1 && (
        <p className="mt-3 text-center text-[11px] text-[#f9a825]">
          لديك {questions.length - answeredCount} سؤالًا بلا إجابة — ستُحسب خاطئة.
        </p>
      )}
    </div>
  );
}
