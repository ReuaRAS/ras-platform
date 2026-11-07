import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/**
 * إعدادات Next.js.
 *
 * - outputFileTracingIncludes: يضمن شمول خطوط PDF العربية في حزمة النشر
 *   (تُقرأ من public/fonts وقت التشغيل في /api/test/submit).
 * - Sentry: يُحمَّل عبر `instrumentation.ts` و`instrumentation-client.ts` فقط عند
 *   ضبط `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`؛ بلا DSN لا يُرسل شيء.
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

// يجعل `next dev` يوفّر ربط Cloudflare المحلي (ASSETS وغيرها) الذي تحتاجه قراءة الخطوط في lib/pdf/generate.ts.
initOpenNextCloudflareForDev({ configPath: "./freebuff.wrangler.jsonc" });
