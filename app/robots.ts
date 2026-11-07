import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/supabase/env";

/** robots.txt: يفتح الموقع العام ويحجب لوحة الإدارة وواجهات الـAPI وصفحات التحقق. */
export default function robots(): MetadataRoute.Robots {
  const base = APP_URL.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/verify/", "/test/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
