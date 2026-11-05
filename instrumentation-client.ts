import * as Sentry from "@sentry/nextjs";

/**
 * تهيئة Sentry في المتصفح. تعمل فقط عند ضبط `NEXT_PUBLIC_SENTRY_DSN`.
 * بلا DSN لا يُحمَّل أي شيء ولا تُرسل أي بيانات.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
