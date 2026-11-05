import "server-only";

import type { CSSProperties } from "react";
import { getContentSector } from "@/lib/content";
import type { ContentSector, ContentSlide } from "@/lib/content/types";
import { SECTORS, getSectorMeta, type SectorMeta } from "@/lib/sectors";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicSupabase } from "@/lib/supabase/public";
import type {
  Announcement,
  Certificate,
  Course,
  Law,
  Reward,
  Schedule,
  Sector,
  Test,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* مساعدات                                                             */
/* ------------------------------------------------------------------ */

/** معرّفات المحتوى المهيّأ تبدأ بـ content: (ليست UUID) */
export const CONTENT_PREFIX = "content:";
export const isContentId = (id: string) => id.startsWith(CONTENT_PREFIX);
const cid = (...parts: string[]) => CONTENT_PREFIX + parts.join(":");

/** استعلام آمن: يُرجع null عند الخطأ أو عدم التهيئة بدل إسقاط الصفحة */
async function safeRows<T>(
  run: () => PromiseLike<{ data: unknown; error: unknown }>,
): Promise<T[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await run();
    if (error) return null;
    return (data as T[]) ?? null;
  } catch {
    return null;
  }
}

/**
 * عميل القراءة العامة بدون كوكيز: شرط أساسي لتصيير الصفحات مسبقًا (ISR).
 * كل الكتابة تمر عبر Server Actions بعميل service_role.
 */
async function supabase() {
  return createPublicSupabase();
}

function fallbackSector(meta: SectorMeta): Sector {
  return {
    id: cid(meta.slug),
    slug: meta.slug,
    name: meta.name,
    sector_code: meta.sector_code,
    description: meta.description,
    logo_url: null,
    primary_color: meta.primary_color,
    is_active: true,
  };
}

/* ------------------------------------------------------------------ */
/* القطاعات                                                            */
/* ------------------------------------------------------------------ */

export async function getSectors(): Promise<Sector[]> {
  const sb = await supabase();
  const rows = sb
    ? await safeRows<Sector>(() =>
        sb.from("sectors").select("*").eq("is_active", true).order("created_at"),
      )
    : null;

  if (!rows || rows.length === 0) return SECTORS.map(fallbackSector);

  // حافظ على ترتيب القطاعات المعتمد
  return [...rows].sort((a, b) => {
    const ao = getSectorMeta(a.slug)?.order ?? 99;
    const bo = getSectorMeta(b.slug)?.order ?? 99;
    return ao - bo;
  });
}

export async function getSectorBySlug(slug: string): Promise<Sector | null> {
  const sectors = await getSectors();
  const found = sectors.find((s) => s.slug === slug);
  if (found) return found;
  const meta = getSectorMeta(slug);
  return meta ? fallbackSector(meta) : null;
}

export function getTheme(sector: Sector): {
  main: string;
  light: string;
  dark: string;
} {
  const meta = getSectorMeta(sector.slug);
  const main = sector.primary_color || meta?.primary_color || "#c62828";
  return {
    main,
    light: meta?.primary_color_light ?? main,
    dark: meta?.primary_color_dark ?? main,
  };
}

/** أنماط CSS لألوان القطاع */
export function themeStyle(sector: Sector): CSSProperties {
  const t = getTheme(sector);
  return {
    ["--sector-main" as string]: t.main,
    ["--sector-light" as string]: t.light,
    ["--sector-dark" as string]: t.dark,
  } as CSSProperties;
}

/* ------------------------------------------------------------------ */
/* القوانين والمكافآت                                                  */
/* ------------------------------------------------------------------ */

export function contentLaws(slug: string): Law[] {
  const content = getContentSector(slug);
  const sectorId = cid(slug);
  return (content?.laws ?? []).map((l) => ({
    id: cid(slug, l.law_code),
    sector_id: sectorId,
    law_code: l.law_code,
    title: l.title,
    penalty: l.penalty,
    additional_penalty: l.additional_penalty ?? null,
    category: l.category ?? "main",
    notes: l.notes ?? null,
    sort_order: l.sort_order ?? 0,
    is_active: true,
  }));
}

export async function getLaws(sector: Sector): Promise<Law[]> {
  if (isContentId(sector.id)) return contentLaws(sector.slug);
  const sb = await supabase();
  const rows = sb
    ? await safeRows<Law>(() =>
        sb
          .from("sector_laws")
          .select("*")
          .eq("sector_id", sector.id)
          .eq("is_active", true)
          .order("sort_order"),
      )
    : null;
  return rows && rows.length ? rows : contentLaws(sector.slug);
}

export function contentRewards(slug: string): Reward[] {
  const content = getContentSector(slug);
  return (content?.rewards ?? []).map((r) => ({
    id: cid(slug, r.reward_code),
    sector_id: cid(slug),
    reward_code: r.reward_code,
    title: r.title,
    reward_value: r.reward_value,
    conditions: r.conditions ?? null,
    sort_order: r.sort_order ?? 0,
    is_active: true,
  }));
}

export async function getRewards(sector: Sector): Promise<Reward[]> {
  if (isContentId(sector.id)) return contentRewards(sector.slug);
  const sb = await supabase();
  const rows = sb
    ? await safeRows<Reward>(() =>
        sb
          .from("sector_rewards")
          .select("*")
          .eq("sector_id", sector.id)
          .eq("is_active", true)
          .order("sort_order"),
      )
    : null;
  return rows && rows.length ? rows : contentRewards(sector.slug);
}

/* ------------------------------------------------------------------ */
/* الدورات                                                            */
/* ------------------------------------------------------------------ */

export type CourseSlidesData = {
  slides: ContentSlide[];
  pdf_url?: string | null;
  source_url?: string | null;
};

export function contentCourses(slug: string): Course[] {
  const content = getContentSector(slug);
  return (content?.courses ?? []).map((c) => ({
    id: cid(slug, c.slug),
    sector_id: cid(slug),
    title: c.title,
    slug: c.slug,
    description: c.description ?? null,
    slides_content: {
      slides: c.slides,
      pdf_url: c.pdf_url ?? null,
      source_url: c.source_url ?? null,
    } satisfies CourseSlidesData,
    certificate_prefix: c.certificate_prefix,
    pass_score: c.pass_score ?? 70,
    time_limit_minutes: c.time_limit_minutes ?? 20,
    questions_per_attempt: c.questions_per_attempt ?? 10,
    duration_days: c.duration_days ?? null,
    is_active: c.is_active ?? true,
  }));
}

export async function getCourses(sector: Sector): Promise<Course[]> {
  if (isContentId(sector.id)) return contentCourses(sector.slug).filter((c) => c.is_active);
  const sb = await supabase();
  const rows = sb
    ? await safeRows<Course>(() =>
        sb
          .from("courses")
          .select("*")
          .eq("sector_id", sector.id)
          .eq("is_active", true)
          .order("created_at"),
      )
    : null;
  return rows && rows.length ? rows : contentCourses(sector.slug).filter((c) => c.is_active);
}

export async function getCourse(sector: Sector, courseSlug: string): Promise<Course | null> {
  const courses = await getCourses(sector);
  return courses.find((c) => c.slug === courseSlug) ?? null;
}

export function parseSlides(course: Course): CourseSlidesData {
  const raw = course.slides_content as CourseSlidesData | null;
  if (raw && Array.isArray(raw.slides)) return raw;
  if (Array.isArray(course.slides_content)) {
    return { slides: course.slides_content as ContentSlide[] };
  }
  return { slides: [] };
}

/* ------------------------------------------------------------------ */
/* التوظيف                                                            */
/* ------------------------------------------------------------------ */

export type RecruitmentView = {
  is_open: boolean;
  description: string | null;
  conditions: string[];
  guide: ContentSlide[];
  guide_pdf_url: string | null;
};

export async function getRecruitment(sector: Sector): Promise<RecruitmentView> {
  const content = getContentSector(sector.slug);
  const fallback: RecruitmentView = {
    is_open: content?.recruitment?.is_open ?? false,
    description: content?.recruitment?.description ?? null,
    conditions: content?.recruitment?.conditions ?? [],
    guide: content?.guide ?? [],
    guide_pdf_url: content?.guide_pdf_url ?? null,
  };

  if (isContentId(sector.id)) return fallback;

  const sb = await supabase();
  const rows = sb
    ? await safeRows<{
        description: string | null;
        guide_content: unknown;
        is_open: boolean;
      }>(() =>
        sb
          .from("recruitment_info")
          .select("description, guide_content, is_open")
          .eq("sector_id", sector.id)
          .limit(1),
      )
    : null;

  const row = rows?.[0];
  if (!row) return fallback;

  const guide = row.guide_content as
    | { slides?: ContentSlide[]; conditions?: string[]; pdf_url?: string | null }
    | ContentSlide[]
    | null;

  if (Array.isArray(guide)) {
    return { ...fallback, description: row.description, is_open: row.is_open, guide };
  }

  return {
    is_open: row.is_open,
    description: row.description ?? fallback.description,
    conditions: guide?.conditions?.length ? guide.conditions : fallback.conditions,
    guide: guide?.slides?.length ? guide.slides : fallback.guide,
    guide_pdf_url: guide?.pdf_url ?? fallback.guide_pdf_url,
  };
}

/* ------------------------------------------------------------------ */
/* الاختبارات                                                          */
/* ------------------------------------------------------------------ */

export async function getTests(sector: Sector): Promise<Test[]> {
  if (isContentId(sector.id)) return [];
  const sb = await supabase();
  const rows = sb
    ? await safeRows<Test>(() =>
        sb
          .from("tests")
          .select("*")
          .eq("sector_id", sector.id)
          .eq("is_active", true)
          .order("created_at"),
      )
    : null;
  return rows ?? [];
}

/** اختبار مرتبط بدورة معيّنة (أو null) */
export async function getTestForCourse(sector: Sector, courseId: string): Promise<Test | null> {
  if (isContentId(courseId)) return null;
  const sb = await supabase();
  if (!sb) return null;
  const rows = await safeRows<Test>(() =>
    sb
      .from("tests")
      .select("*")
      .eq("sector_id", sector.id)
      .eq("course_id", courseId)
      .eq("is_active", true)
      .limit(1),
  );
  return rows?.[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* الإعلانات والجداول                                                 */
/* ------------------------------------------------------------------ */

export async function getAnnouncements(sector: Sector): Promise<Announcement[]> {
  if (isContentId(sector.id)) {
    const content = getContentSector(sector.slug);
    return (content?.announcements ?? []).map((a, i) => ({
      id: cid(sector.slug, "ann", String(i)),
      sector_id: cid(sector.slug),
      title: a.title,
      content: a.content,
      event_date: null,
      is_pinned: a.is_pinned ?? false,
      is_published: true,
      created_at: new Date(0).toISOString(),
    }));
  }
  const sb = await supabase();
  const rows = sb
    ? await safeRows<Announcement>(() =>
        sb
          .from("announcements")
          .select("*")
          .eq("sector_id", sector.id)
          .eq("is_published", true)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false }),
      )
    : null;
  return rows ?? [];
}

export async function getSchedules(sector: Sector): Promise<Schedule[]> {
  const content = getContentSector(sector.slug);
  const fallback: Schedule[] = (content?.schedules ?? []).map((s, i) => ({
    id: cid(sector.slug, "sch", String(i)),
    sector_id: cid(sector.slug),
    title: s.title,
    columns: s.columns,
    rows: s.rows,
    image_url: null,
    notes: s.notes ?? null,
    is_published: true,
    updated_at: new Date(0).toISOString(),
  }));

  if (isContentId(sector.id)) return fallback;

  const sb = await supabase();
  const rows = sb
    ? await safeRows<Schedule>(() =>
        sb
          .from("sector_schedules")
          .select("*")
          .eq("sector_id", sector.id)
          .eq("is_published", true)
          .order("updated_at", { ascending: false }),
      )
    : null;
  return rows && rows.length ? rows : fallback;
}

/* ------------------------------------------------------------------ */
/* الشهادات                                                           */
/* ------------------------------------------------------------------ */

export async function getCertificateByNo(certificateNo: string): Promise<Certificate | null> {
  const sb = await supabase();
  if (!sb) return null;
  const rows = await safeRows<Certificate>(() =>
    sb
      .from("certificates")
      .select(
        "id, certificate_no, sector_id, course_id, test_attempt_id, trainee_name, discord_username, discord_id, course_title, score, percentage, pdf_url, qr_code_url, verify_url, status, issued_at, expires_at, revoked_reason",
      )
      .eq("certificate_no", certificateNo.trim())
      .limit(1),
  );
  return rows?.[0] ?? null;
}

export type { ContentSector };
