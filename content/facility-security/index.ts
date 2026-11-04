import type { ContentSector } from "@/lib/content/types";

/**
 * قطاع أمن منشآت (FS) — لا يوجد محتوى قابل للقراءة بعد.
 *
 * الروابط المشتركة مع أمن العام (12.4) تتطلب صلاحية وصول (HTTP 401)،
 * ولم يتم تخمين توزيع الملفات بين PS و FS كما تنص المواصفة.
 *
 * كل ما يحتاجه القطاع: إضافة الدورات والقوانين من لوحة الإدارة،
 * أو منح صلاحية قراءة للروابط ثم إعادة الاستيراد.
 */
export const facilitySecurityContent: ContentSector = {
  slug: "facility-security",
  name: "أمن منشآت",
  sector_code: "FS",
  primary_color: "#27ae60",
  primary_color_light: "#2ecc71",
  primary_color_dark: "#1e8449",
  description: "أمن منشآت بمحافظة الرس — حماية المنشآت الحيوية والموانئ والمرافق.",
  laws: [],
  rewards: [],
  guide: [],
  recruitment: {
    is_open: false,
    description:
      "لم تُتح مواد القطاع بعد. تُضاف الدورات والقوانين من لوحة الإدارة عند توفرها.",
    conditions: [],
  },
  courses: [],
  schedules: [],
};
