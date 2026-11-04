/**
 * السجل الثابت للقطاعات الخمسة.
 * يُستخدم للعرض عند تعذّر الوصول إلى جدول `sectors`، وللبذور (seeds) وللمصادقة.
 * إضافة قطاع جديد لا تتطلب تعديل هذا الملف: القطاعات تُقرأ من قاعدة البيانات
 * وهذا السجل يعمل كاحتياطي فقط.
 */

export type SectorMeta = {
  slug: string;
  sector_code: string;
  name: string;
  short_name: string;
  description: string;
  primary_color: string;
  primary_color_light: string;
  primary_color_dark: string;
  /** البريد الإداري — يُستخدم فقط كخريطة للدخول عند إنشاء الحسابات */
  admin_email: string;
  /** رمز تعبيري للعرض السريع */
  icon: string;
  order: number;
};

export const SECTORS: SectorMeta[] = [
  {
    slug: "red-crescent",
    sector_code: "RCA",
    name: "الهلال الأحمر",
    short_name: "الهلال",
    description: "الإسعاف والإنعاش والعمليات الميدانية والدعم الجوي في محافظة الرس.",
    primary_color: "#c62828",
    primary_color_light: "#e63946",
    primary_color_dark: "#b71c1c",
    admin_email: "rca@ras.internal",
    icon: "⛑️",
    order: 1,
  },
  {
    slug: "mechanic-garage",
    sector_code: "MG",
    name: "كراج الميكانيك",
    short_name: "الميكانيك",
    description: "صيانة المركبات، التعديل والتزويد، والتسطيح الميداني.",
    primary_color: "#e67e22",
    primary_color_light: "#f39c12",
    primary_color_dark: "#ca6f1e",
    admin_email: "mg@ras.internal",
    icon: "🔧",
    order: 2,
  },
  {
    slug: "public-security",
    sector_code: "PS",
    name: "أمن العام",
    short_name: "أمن العام",
    description: "الأمن العام والمرور والمهام الخاصة وحفظ النظام في المحافظة.",
    primary_color: "#2980b9",
    primary_color_light: "#3498db",
    primary_color_dark: "#1f618d",
    admin_email: "ps@ras.internal",
    icon: "🚓",
    order: 3,
  },
  {
    slug: "facility-security",
    sector_code: "FS",
    name: "أمن منشآت",
    short_name: "أمن منشآت",
    description: "حماية المنشآت الحيوية والموانئ والمرافق الحكومية.",
    primary_color: "#27ae60",
    primary_color_light: "#2ecc71",
    primary_color_dark: "#1e8449",
    admin_email: "fs@ras.internal",
    icon: "🏛️",
    order: 4,
  },
  {
    slug: "security-brigades",
    sector_code: "SB",
    name: "الأفواج الأمنية",
    short_name: "الأفواج",
    description: "قطاع جديد — لوحة إدارته جاهزة بالكامل، والمحتوى يُضاف من لوحة الإدارة.",
    primary_color: "#8e44ad",
    primary_color_light: "#9b59b6",
    primary_color_dark: "#6c3483",
    admin_email: "sb@ras.internal",
    icon: "🛡️",
    order: 5,
  },
];

export function getSectorMeta(slug: string): SectorMeta | undefined {
  return SECTORS.find((s) => s.slug === slug);
}

export function getSectorMetaByCode(code: string): SectorMeta | undefined {
  return SECTORS.find((s) => s.sector_code === code);
}

export const SECTOR_SLUGS = SECTORS.map((s) => s.slug);
