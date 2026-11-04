import type { NextConfig } from "next";

/**
 * إعدادات Next.js.
 *
 * - outputFileTracingIncludes: يضمن شمول خطوط PDF العربية في حزمة النشر
 *   (تُقرأ من public/fonts وقت التشغيل في /api/test/submit).
 * - Sentry: الحزمة مثبّتة كنقطة ربط. لتفعيلها أنشئ sentry.client.config.ts
 *   و sentry.server.config.ts و لفّ الإعداد عبر withSentryConfig.
 */
const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./public/fonts/**/*"],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
