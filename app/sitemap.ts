import type { MetadataRoute } from "next";
import { SECTORS } from "@/lib/sectors";
import { APP_URL } from "@/lib/supabase/env";

/** خرائط الموقع العامة — تُبنى من بيانات القطاعات الثابتة (بدون استعلام قاعدة بيانات). */
export const revalidate = 3600;

const SECTOR_PAGES = [
  "",
  "/laws",
  "/rewards",
  "/courses",
  "/recruitment",
  "/recruitment/guide",
  "/schedule",
  "/announcements",
  "/help",
  "/leaderboard",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = APP_URL.replace(/\/$/, "");
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/certificates`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/leaderboard`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    {
      url: `${base}/tools/field-name-generator`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const sectorPages: MetadataRoute.Sitemap = SECTORS.flatMap((sector) =>
    SECTOR_PAGES.map((path) => ({
      url: `${base}/sectors/${sector.slug}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 0.9 : 0.6,
    })),
  );

  return [...staticPages, ...sectorPages];
}
