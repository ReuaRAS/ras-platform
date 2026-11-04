"use client";

import Link from "next/link";
import { useState } from "react";
import RegistrationForm from "./RegistrationForm";
import TestRunner from "./TestRunner";
import type {
  PublicQuestion,
  RegistrationValues,
  StartAttemptResponse,
  SubmitAttemptResponse,
  SuspicionFlag,
} from "@/lib/test-types";

type Stage = "register" | "running" | "result";

export default function TestFlow({
  testId,
  testTitle,
  passScore,
  timeLimitMinutes,
  questionsCount,
  siteKey,
}: {
  testId: string;
  testTitle: string;
  passScore: number;
  timeLimitMinutes: number;
  questionsCount: number | null;
  siteKey: string;
}) {
  const [stage, setStage] = useState<Stage>("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<StartAttemptResponse | null>(null);
  const [result, setResult] = useState<SubmitAttemptResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function start(values: RegistrationValues, turnstileToken: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/test/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId,
          traineeName: values.traineeName,
          discordUsername: values.discordUsername,
          discordId: values.discordId,
          realAge: values.realAge,
          currentRank: values.currentRank,
          turnstileToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "تعذّر بدء الاختبار.");
      setAttempt(data as StartAttemptResponse);
      setStage("running");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(answers: Map<string, string>, flags: SuspicionFlag[]) {
    if (!attempt) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.attemptId,
          answers: attempt.questions.map((q) => ({
            questionId: q.id,
            choiceId: answers.get(q.id) ?? null,
          })),
          suspicionFlags: flags,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "تعذّر تسليم الاختبار.");
      setResult(data as SubmitAttemptResponse);
      setStage("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع.");
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === "running" && attempt) {
    return (
      <div style={{ ["--sector-main" as string]: "#c62828" }}>
        {error && (
          <p className="mx-auto mb-3 max-w-3xl rounded-xl border border-[#c62828]/40 bg-[#c62828]/10 px-4 py-2 text-xs font-bold text-[#f87171]">
            {error}
          </p>
        )}
        <TestRunner
          questions={attempt.questions as PublicQuestion[]}
          timeLimitMinutes={attempt.timeLimitMinutes}
          submitting={submitting}
          onSubmit={submit}
        />
      </div>
    );
  }

  if (stage === "result" && result) {
    const passed = result.passed;
    return (
      <div className="glass-card mx-auto max-w-2xl rounded-3xl p-8 text-center">
        <div
          className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
            passed ? "bg-[#27ae60]/15" : "bg-[#c62828]/15"
          }`}
          aria-hidden="true"
        >
          {passed ? "🎉" : "😔"}
        </div>

        <h1 className="text-2xl font-black">
          {passed ? "مبروك — اجتزت الاختبار" : "لم تجتز الاختبار"}
        </h1>

        <p className="mt-2 text-sm text-[#94a3b8]">
          نتيجتك <span className="font-extrabold text-white">{result.percentage}%</span> — نسبة
          النجاح المطلوبة {result.passScore}%
        </p>

        <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl bg-black/30 py-3">
            <p className="text-[#94a3b8]">النقاط</p>
            <p className="mt-1 font-extrabold">
              {result.score} / {result.totalPoints}
            </p>
          </div>
          <div className="rounded-xl bg-black/30 py-3">
            <p className="text-[#94a3b8]">النسبة</p>
            <p className="mt-1 font-extrabold">{result.percentage}%</p>
          </div>
          <div className="rounded-xl bg-black/30 py-3">
            <p className="text-[#94a3b8]">الحالة</p>
            <p className={`mt-1 font-extrabold ${passed ? "text-[#4ade80]" : "text-[#f87171]"}`}>
              {passed ? "ناجح" : "راسب"}
            </p>
          </div>
        </div>

        {result.warning && (
          <p className="mt-4 rounded-xl border border-[#f9a825]/30 bg-[#f9a825]/10 px-4 py-2 text-[11px] text-[#f9a825]">
            {result.warning}
          </p>
        )}

        {passed && result.certificate && (
          <div className="mt-6 rounded-2xl border border-[#f9a825]/25 bg-[#f9a825]/5 p-5">
            <p className="text-xs text-[#94a3b8]">رقم الشهادة</p>
            <p className="mt-1 font-mono text-lg font-black text-[#f9a825]" dir="ltr">
              {result.certificate.certificateNo}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link
                href={`/verify/${encodeURIComponent(result.certificate.certificateNo)}`}
                className="btn btn-gold text-xs"
              >
                عرض الشهادة والتحقق
              </Link>
              {result.certificate.pdfUrl && (
                <a
                  href={result.certificate.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost text-xs"
                >
                  ⬇️ تحميل PDF
                </a>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-2">
          <Link href="/" className="btn btn-ghost text-xs">
            الرئيسية
          </Link>
          {!passed && (
            <button
              type="button"
              className="btn btn-primary text-xs"
              onClick={() => {
                setStage("register");
                setResult(null);
                setAttempt(null);
              }}
            >
              إعادة المحاولة
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <RegistrationForm
      testTitle={testTitle}
      passScore={passScore}
      timeLimitMinutes={timeLimitMinutes}
      questionsCount={questionsCount}
      siteKey={siteKey}
      onStart={start}
      loading={loading}
      error={error}
    />
  );
}
