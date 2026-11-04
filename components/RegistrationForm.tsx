"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import type { RegistrationValues } from "@/lib/test-types";

const EMPTY: RegistrationValues = {
  traineeName: "",
  discordUsername: "",
  discordId: "",
  realAge: "",
  currentRank: "",
};

export default function RegistrationForm({
  testTitle,
  passScore,
  timeLimitMinutes,
  questionsCount,
  siteKey,
  onStart,
  loading,
  error,
}: {
  testTitle: string;
  passScore: number;
  timeLimitMinutes: number;
  questionsCount: number | null;
  siteKey: string;
  onStart: (values: RegistrationValues, turnstileToken: string) => void;
  loading: boolean;
  error?: string | null;
}) {
  const [values, setValues] = useState<RegistrationValues>(EMPTY);
  const [token, setToken] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !window.turnstile || !turnstileRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(turnstileRef.current, {
      sitekey: siteKey,
      theme: "dark",
      language: "ar",
      callback: setToken,
      "expired-callback": () => setToken(""),
    });
  }, [siteKey]);

  useEffect(() => {
    if (error && widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
      setToken("");
    }
  }, [error]);

  function update(key: keyof RegistrationValues, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (values.traineeName.trim().length < 3) return setLocalError("الاسم يجب أن يكون 3 أحرف على الأقل.");
    if (values.discordUsername.trim().length < 2) return setLocalError("اسم ديسكورد مطلوب.");
    if (!/^\d{17,20}$/.test(values.discordId.trim()))
      return setLocalError("معرّف ديسكورد (Copy ID) يجب أن يكون بين 17 و20 رقمًا.");
    const age = Number(values.realAge);
    if (!Number.isInteger(age) || age < 15 || age > 80)
      return setLocalError("العمر يجب أن يكون بين 15 و80.");
    if (values.currentRank.trim().length < 2) return setLocalError("الرتبة الحالية مطلوبة.");
    if (siteKey && !token) return setLocalError("أكمل التحقق (Turnstile) أولًا.");

    onStart(
      {
        traineeName: values.traineeName.trim(),
        discordUsername: values.discordUsername.trim(),
        discordId: values.discordId.trim(),
        realAge: values.realAge.trim(),
        currentRank: values.currentRank.trim(),
      },
      token,
    );
  }

  const message = localError ?? error;

  return (
    <div className="glass-card mx-auto max-w-3xl rounded-3xl p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold sm:text-2xl">{testTitle}</h1>
          <p className="mt-1 text-xs text-[#94a3b8]">
            عبّئ بياناتك بدقة — تُطبع على الشهادة كما تُدخل.
          </p>
        </div>
        <div className="flex gap-2 text-[10px]">
          <span className="badge badge-muted">النجاح {passScore}%</span>
          <span className="badge badge-muted">{timeLimitMinutes} دقيقة</span>
          {questionsCount !== null && (
            <span className="badge badge-muted">{questionsCount} سؤال</span>
          )}
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="traineeName" className="label">
            الاسم في المحافظة *
          </label>
          <input
            id="traineeName"
            className="field"
            value={values.traineeName}
            onChange={(e) => update("traineeName", e.target.value)}
            placeholder="مثال: صدام اليامي"
            maxLength={60}
            required
          />
        </div>

        <div>
          <label htmlFor="discordUsername" className="label">
            اسم ديسكورد *
          </label>
          <input
            id="discordUsername"
            className="field"
            value={values.discordUsername}
            onChange={(e) => update("discordUsername", e.target.value)}
            placeholder="username"
            maxLength={40}
            dir="ltr"
            required
          />
        </div>

        <div>
          <label htmlFor="discordId" className="label">
            معرّف ديسكورد (Copy ID) *
          </label>
          <input
            id="discordId"
            className="field font-mono"
            value={values.discordId}
            onChange={(e) => update("discordId", e.target.value.replace(/\D/g, "").slice(0, 20))}
            placeholder="408308082402131969"
            inputMode="numeric"
            dir="ltr"
            required
          />
        </div>

        <div>
          <label htmlFor="realAge" className="label">
            العمر الحقيقي *
          </label>
          <input
            id="realAge"
            className="field"
            type="number"
            min={15}
            max={80}
            value={values.realAge}
            onChange={(e) => update("realAge", e.target.value)}
            placeholder="18"
            required
          />
        </div>

        <div>
          <label htmlFor="currentRank" className="label">
            الرتبة الحالية *
          </label>
          <input
            id="currentRank"
            className="field"
            value={values.currentRank}
            onChange={(e) => update("currentRank", e.target.value)}
            placeholder="مثال: متدرب"
            maxLength={40}
            required
          />
        </div>

        {siteKey && (
          <div className="sm:col-span-2">
            <span className="label">التحقق الأمني</span>
            <div ref={turnstileRef} className="min-h-[65px]" />
          </div>
        )}

        {message && (
          <p
            role="alert"
            className="sm:col-span-2 rounded-xl border border-[#c62828]/40 bg-[#c62828]/10 px-4 py-2.5 text-xs font-bold text-[#f87171]"
          >
            {message}
          </p>
        )}

        <div className="sm:col-span-2">
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? "جارٍ تجهيز الأسئلة…" : "ابدأ الاختبار"}
          </button>
          <p className="mt-2 text-center text-[10px] leading-relaxed text-[#64748b]">
            بمتابعتك أنت توافق على شروط الاستخدام وسياسة الخصوصية. يُمنع النسخ أو تبديل
            التبويب أثناء الاختبار ويُسجَّل ذلك في تقرير المشرف.
          </p>
        </div>
      </form>

      {siteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => {
            if (window.turnstile && turnstileRef.current && !widgetId.current) {
              widgetId.current = window.turnstile.render(turnstileRef.current, {
                sitekey: siteKey,
                theme: "dark",
                language: "ar",
                callback: setToken,
                "expired-callback": () => setToken(""),
              });
            }
          }}
        />
      )}
    </div>
  );
}
