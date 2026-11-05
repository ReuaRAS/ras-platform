"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { PublicQuestion } from "@/lib/test-types";

type Result = {
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  results: {
    questionId: string;
    isCorrect: boolean;
    correctChoiceId: string | null;
    correctText: string | null;
  }[];
};

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** وضع التدريب: إجابات فورية وتصحيح مفصّل، بلا شهادة ولا نقاط. */
export default function PracticeRunner({
  testId,
  testTitle,
  timeLimitMinutes,
  sectorSlug,
  questions,
}: {
  testId: string;
  testTitle: string;
  timeLimitMinutes: number;
  sectorSlug: string;
  questions: PublicQuestion[];
}) {
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(timeLimitMinutes * 60);

  const submit = useCallback(
    async (current: Map<string, string>) => {
      if (pending || result) return;
      setPending(true);
      setError(null);
      try {
        const res = await fetch("/api/practice/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testId,
            answers: questions.map((q) => ({
              questionId: q.id,
              choiceId: current.get(q.id) ?? null,
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "تعذّر تصحيح التدريب.");
        setResult(data as Result);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "خطأ غير متوقع.");
      } finally {
        setPending(false);
      }
    },
    [pending, result, questions, testId],
  );

  useEffect(() => {
    if (result) return;
    if (secondsLeft <= 0) {
      void submit(answers);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, result, submit, answers]);

  if (result) {
    const correctCount = result.results.filter((r) => r.isCorrect).length;
    return (
      <div className="mt-6 space-y-4">
        <div className="glass-panel rounded-2xl p-6 text-center">
          <p className="text-3xl" aria-hidden="true">
            {result.percentage >= 70 ? "🎯" : "📘"}
          </p>
          <h2 className="mt-2 text-lg font-extrabold">نتيجة التدريب</h2>
          <p className="mt-1 text-3xl font-black text-[var(--sector-light)]">
            {result.percentage}%
          </p>
          <p className="mt-1 text-xs text-[#94a3b8]">
            {correctCount} من {result.results.length} سؤالًا صحيحًا (لا تُصدر شهادة ولا نقاط من
            التدريب)
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setAnswers(new Map());
                setSecondsLeft(timeLimitMinutes * 60);
              }}
              className="btn btn-primary text-xs"
            >
              إعادة التدريب
            </button>
            <Link href={`/sectors/${sectorSlug}/practice`} className="btn btn-ghost text-xs">
              اختبار آخر
            </Link>
            <Link href={`/sectors/${sectorSlug}/courses`} className="btn btn-ghost text-xs">
              الدورات
            </Link>
          </div>
        </div>

        <ol className="space-y-3">
          {questions.map((q, i) => {
            const detail = result.results.find((r) => r.questionId === q.id);
            return (
              <li key={q.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold leading-relaxed">
                    {i + 1}. {q.question_text}
                  </h3>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                      detail?.isCorrect
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-red-500/15 text-red-300"
                    }`}
                  >
                    {detail?.isCorrect ? "صحيح" : "خطأ"}
                  </span>
                </div>
                <ul className="mt-2 space-y-1 text-xs">
                  {q.choices.map((c) => {
                    const picked = answers.get(q.id) === c.id;
                    const isCorrect = detail?.correctChoiceId === c.id;
                    return (
                      <li
                        key={c.id}
                        className={`rounded-lg px-2.5 py-1.5 ${
                          isCorrect
                            ? "bg-emerald-500/10 font-bold text-emerald-300"
                            : picked
                              ? "bg-red-500/10 text-red-300 line-through"
                              : "text-[#94a3b8]"
                        }`}
                      >
                        {c.choice_text}
                        {isCorrect ? " ✓" : ""}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="glass-panel sticky top-16 z-20 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3">
        <div>
          <p className="text-sm font-extrabold">{testTitle}</p>
          <p className="text-[11px] text-[#94a3b8]">
            وضع التدريب — بلا شهادة ولا نقاط · {answers.size}/{questions.length} مُجابة
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-[var(--sector-light)]">
            {formatClock(secondsLeft)}
          </span>
          <button
            type="button"
            onClick={() => void submit(answers)}
            disabled={pending}
            className="btn btn-primary text-xs disabled:opacity-60"
          >
            {pending ? "جارٍ التصحيح…" : "إنهاء وعرض النتيجة"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-xl border border-[#c62828]/40 bg-[#c62828]/10 px-4 py-2 text-xs font-bold text-[#f87171]">
          {error}
        </p>
      )}

      <ol className="space-y-3">
        {questions.map((q, i) => (
          <li key={q.id} className="glass-card rounded-2xl p-4">
            <h3 className="text-sm font-bold leading-relaxed">
              {i + 1}. {q.question_text}
            </h3>
            <div className="mt-3 grid gap-2">
              {q.choices.map((c) => {
                const checked = answers.get(q.id) === c.id;
                return (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors ${
                      checked
                        ? "border-[var(--sector-main)] bg-[color-mix(in_srgb,var(--sector-main)_18%,transparent)]"
                        : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={checked}
                      onChange={() => {
                        const next = new Map(answers);
                        next.set(q.id, c.id);
                        setAnswers(next);
                      }}
                      className="accent-[var(--sector-main)]"
                    />
                    <span>{c.choice_text}</span>
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={() => void submit(answers)}
          disabled={pending}
          className="btn btn-primary text-xs disabled:opacity-60"
        >
          {pending ? "جارٍ التصحيح…" : "إنهاء وعرض النتيجة"}
        </button>
      </div>
    </div>
  );
}
