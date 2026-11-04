import type { ContentSector } from "@/lib/content/types";
import { rcaContent } from "@/content/rca";
import { mechanicContent } from "@/content/mechanic";
import { publicSecurityContent } from "@/content/public-security";
import { facilitySecurityContent } from "@/content/facility-security";

/**
 * المحتوى المهيّأ لكل قطاع — يُستخدم كطبقة احتياطية عندما تكون
 * قاعدة البيانات غير مهيّأة أو فارغة. القطاع SB لا محتوى له إطلاقًا.
 */
const CONTENT: Record<string, ContentSector> = {
  "red-crescent": rcaContent,
  "mechanic-garage": mechanicContent,
  "public-security": publicSecurityContent,
  "facility-security": facilitySecurityContent,
  // "security-brigades": لا محتوى — يُدار بالكامل من لوحة الإدارة
};

export function getContentSector(slug: string): ContentSector | undefined {
  return CONTENT[slug];
}

/** محتوى فارغ لقطاع بدون بيانات (مثل SB) */
export function emptyContent(slug: string, name: string, code: string, color: string): ContentSector {
  return {
    slug,
    name,
    sector_code: code,
    primary_color: color,
    laws: [],
    rewards: [],
    courses: [],
    guide: [],
  };
}

export type { ContentSector };
