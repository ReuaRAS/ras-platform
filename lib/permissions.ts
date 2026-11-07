import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ScrollText,
  Trophy,
  Briefcase,
  GraduationCap,
  FlaskConical,
  TrendingUp,
  Ticket,
  CalendarDays,
  Users,
  ClipboardList,
  BadgeCheck,
  Bell,
  HelpCircle,
  Megaphone,
  Bot,
  ShieldAlert,
} from "lucide-react";
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
  | "recruitment.write"
  | "audit.read"
  | "sector.seed"
  | "members.read"
  | "members.write"
  | "attendance.read"
  | "attendance.write"
  | "discord.read"
  | "notifications.write"
  | "roster.read"
  | "roster.write"
  | "faq.write"
  | "announcements.write";

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
  "recruitment.write",
  "audit.read",
  "sector.seed",
  "members.read",
  "members.write",
  "attendance.read",
  "attendance.write",
  "discord.read",
  "notifications.write",
  "roster.read",
  "roster.write",
  "faq.write",
  "announcements.write",
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
    "recruitment.write",
    "members.read",
    "attendance.read",
    "attendance.write",
    "discord.read",
    "faq.write",
    "announcements.write",
    "roster.read",
    "roster.write",
  ],
  sector_trainer: [
    "laws.read",
    "courses.write",
    "questions.write",
    "tests.write",
    "members.read",
    "attendance.read",
    "attendance.write",
    "roster.read",
  ],
  sector_reviewer: [
    "laws.read",
    "results.read",
    "results.review",
    "certificates.read",
    "members.read",
    "roster.read",
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
  icon: LucideIcon;
  permission?: Permission;
  superOnly?: boolean;
}[] = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/laws", label: "القوانين", icon: ScrollText, permission: "laws.read" },
  { href: "/admin/rewards", label: "المكافآت", icon: Trophy, permission: "rewards.write" },
  { href: "/admin/recruitment", label: "التوظيف", icon: Briefcase, permission: "recruitment.write" },
  { href: "/admin/courses", label: "الدورات", icon: GraduationCap, permission: "courses.write" },
  { href: "/admin/tests", label: "الاختبارات", icon: FlaskConical, permission: "tests.write" },
  {
    href: "/admin/test-results",
    label: "نتائج الاختبارات",
    icon: TrendingUp,
    permission: "results.read",
  },
  {
    href: "/admin/certificates",
    label: "الشهادات",
    icon: Ticket,
    permission: "certificates.read",
  },
  { href: "/admin/schedule", label: "الجدول", icon: CalendarDays, permission: "schedule.write" },
  { href: "/admin/members", label: "الأعضاء والنقاط", icon: Users, permission: "members.read" },
  { href: "/admin/roster", label: "كوادر القطاعات", icon: ClipboardList, permission: "roster.read" },
  {
    href: "/admin/attendance",
    label: "الحضور",
    icon: BadgeCheck,
    permission: "attendance.read",
  },
  {
    href: "/admin/notifications",
    label: "الإشعارات",
    icon: Bell,
    permission: "notifications.write",
  },
  { href: "/admin/faq", label: "الأسئلة الشائعة", icon: HelpCircle, permission: "faq.write" },
  {
    href: "/admin/announcements",
    label: "الإعلانات",
    icon: Megaphone,
    permission: "announcements.write",
  },
  { href: "/admin/discord", label: "Discord", icon: Bot, permission: "discord.read" },
  {
    href: "/admin/audit-logs",
    label: "سجل العمليات",
    icon: ShieldAlert,
    permission: "audit.read",
    superOnly: true,
  },
];
