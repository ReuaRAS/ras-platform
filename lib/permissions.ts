/**
 * خريطة الصلاحيات (القسم 11 من المواصفة).
 *
 * TODO: Phase 9 — تُقرأ الصلاحيات الدقيقة من جدول `role_permissions`
 * عبر دالة `has_permission(perm)` في قاعدة البيانات.
 */

export type Role =
  | "viewer"
  | "sector_admin"
  | "sector_vice"
  | "sector_trainer"
  | "sector_reviewer"
  | "super_admin";

export type Permission =
  | "laws.read"
  | "laws.write"
  | "laws.delete"
  | "rewards.write"
  | "courses.write"
  | "questions.write"
  | "tests.write"
  | "results.read"
  | "results.review"
  | "certificates.read"
  | "certificates.revoke"
  | "schedule.write"
  | "announcements.write"
  | "recruitment.write"
  | "audit.read"
  | "sector.seed"
  | "members.read"
  | "members.write"
  | "attendance.read"
  | "attendance.write"
  | "promotions.read"
  | "promotions.write"
  | "store.read"
  | "store.write"
  | "discord.read"
  | "notifications.write"
  | "faq.write";

const ALL: Permission[] = [
  "laws.read",
  "laws.write",
  "laws.delete",
  "rewards.write",
  "courses.write",
  "questions.write",
  "tests.write",
  "results.read",
  "results.review",
  "certificates.read",
  "certificates.revoke",
  "schedule.write",
  "announcements.write",
  "recruitment.write",
  "audit.read",
  "sector.seed",
  "members.read",
  "members.write",
  "attendance.read",
  "attendance.write",
  "promotions.read",
  "promotions.write",
  "store.read",
  "store.write",
  "discord.read",
  "notifications.write",
  "faq.write",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  viewer: [],
  sector_admin: ALL.filter((p) => p !== "audit.read"),
  sector_vice: [
    "laws.read",
    "laws.write",
    "rewards.write",
    "courses.write",
    "questions.write",
    "tests.write",
    "results.read",
    "results.review",
    "certificates.read",
    "certificates.revoke",
    "schedule.write",
    "announcements.write",
    "recruitment.write",
    "members.read",
    "attendance.read",
    "attendance.write",
    "promotions.read",
    "store.read",
    "discord.read",
    "faq.write",
  ],
  sector_trainer: [
    "laws.read",
    "courses.write",
    "questions.write",
    "tests.write",
    "members.read",
    "attendance.read",
    "attendance.write",
  ],
  sector_reviewer: [
    "laws.read",
    "results.read",
    "results.review",
    "certificates.read",
    "members.read",
    "promotions.read",
  ],
  super_admin: ALL,
};

export function hasPermission(role: string | null | undefined, perm: Permission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role as Role];
  return Boolean(perms?.includes(perm));
}

/** هل يستطيع الوصول إلى لوحة الإدارة؟ */
export function canAccessAdmin(role: string | null | undefined): boolean {
  if (!role) return false;
  return role !== "viewer" && role in ROLE_PERMISSIONS;
}

/** الأدوار التي ترى بيانات قطاعها بالكامل */
export function isSectorStaff(role: string | null | undefined): boolean {
  return canAccessAdmin(role);
}

export const ADMIN_NAV: {
  href: string;
  label: string;
  icon: string;
  permission?: Permission;
  superOnly?: boolean;
}[] = [
  { href: "/admin", label: "لوحة التحكم", icon: "📊" },
  { href: "/admin/laws", label: "القوانين", icon: "📜", permission: "laws.read" },
  { href: "/admin/rewards", label: "المكافآت", icon: "🏆", permission: "rewards.write" },
  { href: "/admin/recruitment", label: "التوظيف", icon: "💼", permission: "recruitment.write" },
  { href: "/admin/courses", label: "الدورات", icon: "🎓", permission: "courses.write" },
  { href: "/admin/tests", label: "الاختبارات", icon: "🧪", permission: "tests.write" },
  {
    href: "/admin/test-results",
    label: "نتائج الاختبارات",
    icon: "📈",
    permission: "results.read",
  },
  {
    href: "/admin/certificates",
    label: "الشهادات",
    icon: "🎫",
    permission: "certificates.read",
  },
  { href: "/admin/schedule", label: "الجدول", icon: "🗓️", permission: "schedule.write" },
  {
    href: "/admin/announcements",
    label: "الإعلانات",
    icon: "📣",
    permission: "announcements.write",
  },
  { href: "/admin/members", label: "الأعضاء والنقاط", icon: "👥", permission: "members.read" },
  {
    href: "/admin/attendance",
    label: "الحضور",
    icon: "✅",
    permission: "attendance.read",
  },
  {
    href: "/admin/promotions",
    label: "الترقيات والرتب",
    icon: "🎖️",
    permission: "promotions.read",
  },
  { href: "/admin/store", label: "متجر النقاط", icon: "🛒", permission: "store.read" },
  {
    href: "/admin/notifications",
    label: "الإشعارات",
    icon: "🔔",
    permission: "notifications.write",
  },
  { href: "/admin/faq", label: "الأسئلة الشائعة", icon: "❓", permission: "faq.write" },
  { href: "/admin/discord", label: "Discord", icon: "🤖", permission: "discord.read" },
  {
    href: "/admin/audit-logs",
    label: "سجل العمليات",
    icon: "🕵️",
    permission: "audit.read",
    superOnly: true,
  },
];
