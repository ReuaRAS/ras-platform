/** أنواع النطاق المشتركة بين قاعدة البيانات والمحتوى المهيّأ. */

export type Sector = {
  id: string;
  slug: string;
  name: string;
  sector_code: string;
  description: string | null;
  logo_url: string | null;
  primary_color: string | null;
  is_active: boolean;
};

export type Law = {
  id: string;
  sector_id: string;
  law_code: string;
  title: string;
  penalty: string;
  additional_penalty: string | null;
  category: string | null;
  notes: string | null;
  sort_order: number;
  is_active?: boolean;
};

export type Reward = {
  id: string;
  sector_id: string;
  reward_code: string;
  title: string;
  reward_value: string;
  conditions: string | null;
  sort_order: number;
  is_active?: boolean;
};

export type Course = {
  id: string;
  sector_id: string;
  title: string;
  slug: string;
  description: string | null;
  slides_content: unknown;
  pdf_url?: string | null;
  certificate_prefix: string;
  pass_score: number;
  time_limit_minutes: number;
  questions_per_attempt: number;
  duration_days: number | null;
  is_active: boolean;
};

export type Test = {
  id: string;
  sector_id: string;
  course_id: string | null;
  type: string; // recruitment | course
  title: string;
  description: string | null;
  pass_score: number;
  time_limit_minutes: number;
  questions_per_attempt: number;
  is_active: boolean;
};

export type Recruitment = {
  sector_id: string;
  description: string | null;
  guide_content: unknown;
  is_open: boolean;
};

export type Announcement = {
  id: string;
  sector_id: string | null;
  title: string;
  content: string | null;
  event_date: string | null;
  is_pinned: boolean;
  is_published: boolean;
  created_at: string;
};

export type Schedule = {
  id: string;
  sector_id: string;
  title: string;
  columns: { key: string; label: string }[];
  rows: Record<string, string>[];
  image_url: string | null;
  notes: string | null;
  is_published: boolean;
  updated_at: string;
};

export type Certificate = {
  id: string;
  certificate_no: string;
  sector_id: string;
  course_id: string | null;
  test_attempt_id: string | null;
  trainee_name: string;
  discord_username: string;
  discord_id: string;
  course_title: string;
  score: number;
  percentage: number;
  pdf_url: string | null;
  qr_code_url: string | null;
  verify_url: string | null;
  status: "valid" | "revoked" | "expired";
  issued_at: string;
  expires_at: string | null;
  revoked_reason: string | null;
};

export type TestAttempt = {
  id: string;
  sector_id: string;
  test_id: string;
  course_id: string | null;
  test_type: string;
  trainee_name: string;
  discord_username: string;
  discord_id: string;
  real_age: number;
  current_rank: string;
  selected_question_ids: string[];
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  suspicion_flags: { type: string; at: string }[];
  is_practice: boolean;
  started_at: string;
  submitted_at: string | null;
  ip_address: string | null;
};

export type Slide = {
  title: string;
  content?: string;
  image?: string;
};

export const ROLE_LABELS: Record<string, string> = {
  viewer: "مشاهد",
  sector_admin: "قائد قطاع",
  sector_vice: "نائب القائد",
  sector_trainer: "مدرب",
  sector_reviewer: "مراجع",
  super_admin: "مدير عام",
};
