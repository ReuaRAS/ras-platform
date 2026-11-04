/**
 * أنواع المحتوى المهيّأ (content/*) — يُستخدم كطبقة احتياطية
 * عندما لا تتوفر قاعدة البيانات أو تكون فارغة.
 */

export type ContentLaw = {
  law_code: string;
  title: string;
  penalty: string;
  additional_penalty?: string | null;
  category?: string | null;
  notes?: string | null;
  sort_order?: number;
};

export type ContentReward = {
  reward_code: string;
  title: string;
  reward_value: string;
  conditions?: string | null;
  sort_order?: number;
};

export type ContentSlide = {
  title: string;
  /** HTML مبسّط يُعرض داخل السلايد */
  content: string;
};

export type ContentQuestion = {
  question_text: string;
  choices: { choice_text: string; is_correct: boolean }[];
};

export type ContentCourse = {
  slug: string;
  title: string;
  description?: string;
  certificate_prefix: string;
  pass_score?: number;
  time_limit_minutes?: number;
  questions_per_attempt?: number;
  duration_days?: number | null;
  slides: ContentSlide[];
  /** رابط عرض PDF (عروض Google Slides المحوّلة) */
  pdf_url?: string | null;
  /** المصدر الأصلي للمادة */
  source_url?: string | null;
  /** بنك أسئلة الدورة — اتركه فارغًا إن لم يتوفر مصدر */
  questions?: ContentQuestion[];
  is_active?: boolean;
};

export type ContentSchedule = {
  title: string;
  source_url?: string;
  columns: { key: string; label: string }[];
  rows: Record<string, string>[];
  notes?: string;
};

export type ContentSector = {
  slug: string;
  name: string;
  sector_code: string;
  description?: string;
  primary_color: string;
  primary_color_light?: string;
  primary_color_dark?: string;
  /** الدورات؛ الفهرس هو ترتيب العرض */
  courses?: ContentCourse[];
  /** دليل التوظيف (سلايدات) */
  guide?: ContentSlide[];
  /** رابط دليل التوظيف بصيغة PDF (إن وُجد المصدر كعرض) */
  guide_pdf_url?: string | null;
  /** بنك أسئلة اختبار التوظيف */
  recruitment_questions?: ContentQuestion[];
  laws?: ContentLaw[];
  rewards?: ContentReward[];
  recruitment?: {
    is_open: boolean;
    description?: string;
    conditions?: string[];
  };
  announcements?: {
    title: string;
    content: string;
    is_pinned?: boolean;
  }[];
  /** JOIN/Schedule tables */
  schedules?: ContentSchedule[];
};
