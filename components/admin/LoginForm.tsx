"use client";

import Script from "next/script";
import { useActionState, useEffect, useRef, useState } from "react";
import { loginAction, type LoginState } from "@/lib/auth/actions";
import { LOGIN_SECTORS } from "@/lib/auth/sector-map";

export default function LoginForm({ siteKey }: { siteKey: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [sector, setSector] = useState(LOGIN_SECTORS[0]?.slug ?? "");
  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !window.turnstile || !turnstileRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(turnstileRef.current, {
      sitekey: siteKey,
      theme: "dark",
      language: "ar",
      "error-callback": () => undefined,
    });
  }, [siteKey]);

  const selected = LOGIN_SECTORS.find((s) => s.slug === sector);

  return (
    <form
      action={formAction}
      className="glass-card w-full max-w-md rounded-3xl p-7"
      style={{ ["--sector-main" as string]: selected?.color ?? "#c62828" }}
    >
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62828] to-[#7f1d1d] text-xl">
          🛡️
        </span>
        <h1 className="text-lg font-extrabold">لوحة إدارة القطاعات</h1>
        <p className="mt-1 text-[11px] text-[#94a3b8]">
          لكل قطاع حساب إدارة مستقل (بريد داخلي) وكلمة مرور خاصة به: اختر القطاع ثم أدخل كلمة مروره.
        </p>
      </div>

      <div className="mb-4">
        <label htmlFor="sector" className="label">
          القطاع
        </label>
        <select
          id="sector"
          name="sector"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="field"
          required
        >
          {LOGIN_SECTORS.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.icon} {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="password" className="label">
          كلمة المرور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      {siteKey && (
        <div className="mb-4">
          <div ref={turnstileRef} className="min-h-[65px]" />
        </div>
      )}

      {state.error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-[#c62828]/40 bg-[#c62828]/10 px-3 py-2 text-[11px] font-bold text-[#f87171]"
        >
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary w-full text-sm">
        {pending ? "جارٍ التحقق…" : "دخول"}
      </button>

      <p className="mt-4 text-center text-[10px] leading-relaxed text-[#64748b]">
        الدخول مسجّل في سجل العمليات مع الوقت وعنوان IP. يُمنع مشاركة بيانات الدخول.
      </p>

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
              });
            }
          }}
        />
      )}
    </form>
  );
}
