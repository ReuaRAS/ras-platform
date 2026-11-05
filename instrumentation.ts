import * as Sentry from "@sentry/nextjs";

/**
 * نقطة تحميل Sentry في Next.js 15: تحمّل إعداد السيرفر أو الـ Edge حسب البيئة.
 * ملفات التهيئة نفسها لا تفعل شيئًا إن لم يُضبط `SENTRY_DSN`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/** يرسل أخطاء الطلبات غير المعالَجة إلى Sentry إن كان مفعّلًا. */
export const onRequestError = Sentry.captureRequestError;
