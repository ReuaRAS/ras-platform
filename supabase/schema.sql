-- =====================================================================
-- منصة قطاعات محافظة الرس — مخطط قاعدة البيانات (Supabase / PostgreSQL)
-- =====================================================================
-- طريقة التشغيل:
--   Supabase Dashboard → SQL Editor → New query → الصق الملف كاملًا → Run
-- الملف idempotent نسبيًا: يمكن إعادة تشغيله بأمان (drop policy if exists).
--
-- ترتيب الأقسام:
--   1) الامتدادات والمساعدات
--   2) الجداول الأساسية (4.1 – 4.13)
--   3) جداول المراحل 8 – 13 (بنية فارغة + TODO)
--   4) الدوال (RPC)
--   5) RLS والسياسات
--   6) التخزين (Storage buckets)
--   7) البيانات الأولية (القطاعات الخمسة)
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1) مساعدات عامة
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2) الجداول الأساسية
-- ---------------------------------------------------------------------

-- 4.1 القطاعات
create table if not exists public.sectors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sector_code text not null,
  description text,
  logo_url text,
  primary_color text default '#c62828',
  discord_guild_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.2 الملفات الشخصية (مرتبطة بـ auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  sector_id uuid references public.sectors (id) on delete set null,
  display_name text,
  role text not null default 'viewer'
    check (role in ('viewer', 'sector_admin', 'sector_vice', 'sector_trainer', 'sector_reviewer', 'super_admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.3 القوانين
create table if not exists public.sector_laws (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors (id) on delete cascade,
  law_code text not null,
  title text not null,
  penalty text not null,
  additional_penalty text,
  category text not null default 'main' check (category in ('main', 'common')),
  notes text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sector_id, law_code)
);

-- 4.4 المكافآت
create table if not exists public.sector_rewards (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors (id) on delete cascade,
  reward_code text not null,
  title text not null,
  reward_value text not null,
  conditions text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sector_id, reward_code)
);

-- 4.5 الدورات
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors (id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  slides_content jsonb not null default '{"slides":[]}'::jsonb,
  pdf_url text,
  certificate_prefix text not null,
  pass_score integer not null default 70 check (pass_score between 1 and 100),
  time_limit_minutes integer not null default 20 check (time_limit_minutes between 1 and 240),
  questions_per_attempt integer not null default 10 check (questions_per_attempt between 1 and 100),
  duration_days integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sector_id, slug)
);

-- 4.6 الاختبارات
create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  type text not null default 'course' check (type in ('course', 'recruitment')),
  title text not null,
  description text,
  pass_score integer not null default 70 check (pass_score between 1 and 100),
  time_limit_minutes integer not null default 20 check (time_limit_minutes between 1 and 240),
  questions_per_attempt integer not null default 10 check (questions_per_attempt between 1 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.7 بنك الأسئلة
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests (id) on delete cascade,
  question_text text not null,
  points integer not null default 1 check (points between 1 and 10),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  choice_text text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4.8 محاولات الاختبار
create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors (id) on delete cascade,
  test_id uuid not null references public.tests (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  test_type text not null default 'course',
  trainee_name text not null,
  discord_username text not null,
  discord_id text not null,
  real_age integer not null check (real_age between 10 and 100),
  current_rank text not null,
  selected_question_ids uuid[] not null default '{}',
  score integer not null default 0,
  total_points integer not null default 0,
  percentage numeric(5, 2) not null default 0,
  passed boolean not null default false,
  suspicion_flags jsonb not null default '[]'::jsonb,
  is_practice boolean not null default false,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  ip_address text
);

-- 4.9 إجابات المحاولات
create table if not exists public.test_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.test_attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  choice_id uuid references public.choices (id) on delete set null,
  is_correct boolean not null default false,
  points_earned integer not null default 0,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

-- 4.10 عدّاد أرقام الشهادات (ذري)
create table if not exists public.certificate_counters (
  sector_id uuid not null references public.sectors (id) on delete cascade,
  prefix text not null,
  year integer not null,
  last_number integer not null default 0,
  primary key (sector_id, prefix, year)
);

-- 4.11 الشهادات
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_no text not null unique,
  sector_id uuid not null references public.sectors (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  test_attempt_id uuid references public.test_attempts (id) on delete set null,
  trainee_name text not null,
  discord_username text not null,
  discord_id text not null,
  course_title text not null,
  score integer not null default 0,
  percentage numeric(5, 2) not null default 0,
  pdf_url text,
  qr_code_url text,
  verify_url text,
  status text not null default 'valid' check (status in ('valid', 'revoked', 'expired')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references auth.users (id) on delete set null,
  revoked_reason text
);

-- 4.12 بيانات التوظيف
create table if not exists public.recruitment_info (
  sector_id uuid primary key references public.sectors (id) on delete cascade,
  description text,
  guide_content jsonb not null default '{"slides":[],"conditions":[]}'::jsonb,
  is_open boolean not null default false,
  updated_at timestamptz not null default now()
);

-- 4.13 الإعلانات
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid references public.sectors (id) on delete cascade,
  title text not null,
  content text,
  event_date timestamptz,
  is_pinned boolean not null default false,
  is_published boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.14 جداول العمل
create table if not exists public.sector_schedules (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors (id) on delete cascade,
  title text not null default 'جدول القطاع',
  columns jsonb not null default '[]'::jsonb,
  rows jsonb not null default '[]'::jsonb,
  image_url text,
  notes text,
  is_published boolean not null default true,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.15 سجل العمليات
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  sector_id uuid references public.sectors (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- 4.16 محاولات الدخول (حد المحاولات)
create table if not exists public.login_attempts (
  email text primary key,
  attempts integer not null default 0,
  locked_until timestamptz,
  last_attempt_at timestamptz not null default now(),
  last_ip text
);

-- ---------------------------------------------------------------------
-- 3) جداول المراحل 8 – 13 (بنية تحتية فقط — بلا سياسات كتابة)
-- ---------------------------------------------------------------------
-- TODO(Phase 8):  نظام XP والترقيات — يُستهلك في صفحات الملف الشخصي.
create table if not exists public.member_xp (
  id uuid primary key default gen_random_uuid(),
  discord_id text not null unique,
  sector_id uuid references public.sectors (id) on delete set null,
  total_xp integer not null default 0,
  level integer not null default 1,
  updated_at timestamptz not null default now()
);

-- TODO(Phase 8): حركات XP (سجل تفصيلي لكل إضافة/خصم).
create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  discord_id text not null,
  sector_id uuid references public.sectors (id) on delete set null,
  amount integer not null,
  reason text,
  created_at timestamptz not null default now()
);

-- TODO(Phase 9): الحضور والانصراف (Discord + لوحة الإدارة).
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid references public.sectors (id) on delete cascade,
  discord_id text not null,
  status text not null default 'present' check (status in ('present', 'late', 'absent', 'excused')),
  checked_in_at timestamptz not null default now(),
  note text
);

-- TODO(Phase 10): الترقيات والرتب.
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid references public.sectors (id) on delete cascade,
  discord_id text not null,
  from_rank text,
  to_rank text not null,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

-- TODO(Phase 11): متجر النقاط.
create table if not exists public.store_items (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid references public.sectors (id) on delete cascade,
  name text not null,
  description text,
  price integer not null default 0,
  stock integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- TODO(Phase 12): الربط مع Discord (تذاكر/أعضاء).
create table if not exists public.discord_events (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid references public.sectors (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- TODO(Phase 13): إشعارات داخل المنصة (جرس الإشعارات).
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid references public.sectors (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  title text not null,
  body text,
  href text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4) الفهارس
-- ---------------------------------------------------------------------

create index if not exists idx_laws_sector on public.sector_laws (sector_id, sort_order);
create index if not exists idx_rewards_sector on public.sector_rewards (sector_id, sort_order);
create index if not exists idx_courses_sector on public.courses (sector_id);
create index if not exists idx_tests_sector on public.tests (sector_id);
create index if not exists idx_questions_test on public.questions (test_id);
create index if not exists idx_choices_question on public.choices (question_id);
create index if not exists idx_attempts_sector on public.test_attempts (sector_id, started_at desc);
create index if not exists idx_attempts_discord on public.test_attempts (discord_id, started_at desc);
create index if not exists idx_attempts_test on public.test_attempts (test_id, passed);
create index if not exists idx_certificates_sector on public.certificates (sector_id, issued_at desc);
create index if not exists idx_certificates_discord on public.certificates (discord_id);
create index if not exists idx_announcements_sector on public.announcements (sector_id, created_at desc);
create index if not exists idx_schedules_sector on public.sector_schedules (sector_id);
create index if not exists idx_audit_sector on public.audit_logs (sector_id, created_at desc);
create index if not exists idx_audit_action on public.audit_logs (action, created_at desc);

-- ---------------------------------------------------------------------
-- 5) الدوال (RPC)
-- ---------------------------------------------------------------------

-- 5.1 دور المستخدم الحالي
create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'viewer');
$$;

-- 5.2 قطاع المستخدم الحالي
create or replace function public.current_sector_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select sector_id from public.profiles where id = auth.uid();
$$;

-- 5.3 صلاحيات الدور (نسخة قاعدة البيانات من lib/permissions.ts)
create or replace function public.role_permissions(p_role text)
returns text[]
language sql
immutable
as $$
  select case p_role
    when 'super_admin' then array[
      'laws.read','laws.write','laws.delete','rewards.write','courses.write',
      'questions.write','tests.write','results.read','results.review',
      'certificates.read','certificates.revoke','schedule.write',
      'announcements.write','recruitment.write','audit.read','sector.seed'
    ]
    when 'sector_admin' then array[
      'laws.read','laws.write','laws.delete','rewards.write','courses.write',
      'questions.write','tests.write','results.read','results.review',
      'certificates.read','certificates.revoke','schedule.write',
      'announcements.write','recruitment.write','sector.seed'
    ]
    when 'sector_vice' then array[
      'laws.read','laws.write','rewards.write','courses.write',
      'questions.write','tests.write','results.read','results.review',
      'certificates.read','certificates.revoke','schedule.write',
      'announcements.write','recruitment.write'
    ]
    when 'sector_trainer' then array['laws.read','courses.write','questions.write','tests.write']
    when 'sector_reviewer' then array['laws.read','results.read','results.review','certificates.read']
    else array[]::text[]
  end;
$$;

create or replace function public.has_permission(p_perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_perm = any (public.role_permissions(public.current_role_name()));
$$;

-- 5.4 هل المستخدم من طاقم القطاع (غير المشاهد)
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() in
    ('super_admin','sector_admin','sector_vice','sector_trainer','sector_reviewer');
$$;

-- 5.5 رقم شهادة ذري: PREFIX-YYYY-NNNN
create or replace function public.issue_certificate_number(
  p_sector_id uuid,
  p_prefix text,
  p_year integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next integer;
  v_no text;
begin
  insert into public.certificate_counters as c (sector_id, prefix, year, last_number)
  values (p_sector_id, p_prefix, p_year, 1)
  on conflict (sector_id, prefix, year)
  do update set last_number = c.last_number + 1
  returning c.last_number into v_next;

  v_no := p_prefix || '-' || p_year::text || '-' || lpad(v_next::text, 4, '0');
  return v_no;
end;
$$;

-- 5.6 حد محاولات الدخول
create or replace function public.check_login_allowed(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locked_until timestamptz;
begin
  select locked_until into v_locked_until from public.login_attempts where email = p_email;

  if v_locked_until is not null and v_locked_until > now() then
    return jsonb_build_object(
      'allowed', false,
      'retry_after_seconds', greatest(1, extract(epoch from (v_locked_until - now()))::integer)
    );
  end if;

  return jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
end;
$$;

create or replace function public.record_failed_login(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempts integer;
begin
  insert into public.login_attempts (email, attempts, last_attempt_at)
  values (p_email, 1, now())
  on conflict (email) do update
    set attempts = case when public.login_attempts.locked_until is not null
                          and public.login_attempts.locked_until < now()
                        then 1
                        else public.login_attempts.attempts + 1 end,
        last_attempt_at = now()
  returning attempts into v_attempts;

  if v_attempts >= 5 then
    update public.login_attempts
      set locked_until = now() + interval '15 minutes', attempts = 0
      where email = p_email;
  end if;
end;
$$;

create or replace function public.reset_login_attempts(p_email text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.login_attempts
    set attempts = 0, locked_until = null
    where email = p_email;
$$;

-- 5.7 نسخ القوانين والمكافآت من قطاع مرجعي
create or replace function public.seed_sector_defaults(
  p_sector_id uuid,
  p_source_sector_slug text default 'red-crescent'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_src uuid;
  v_laws integer := 0;
  v_rewards integer := 0;
begin
  select id into v_src from public.sectors where slug = p_source_sector_slug;
  if v_src is null then
    raise exception 'القطاع المصدر غير موجود: %', p_source_sector_slug;
  end if;
  if v_src = p_sector_id then
    raise exception 'لا يمكن النسخ من القطاع نفسه';
  end if;

  insert into public.sector_laws
    (sector_id, law_code, title, penalty, additional_penalty, category, notes, sort_order)
  select p_sector_id, law_code, title, penalty, additional_penalty, category, notes, sort_order
  from public.sector_laws
  where sector_id = v_src
  on conflict (sector_id, law_code) do nothing;
  get diagnostics v_laws = row_count;

  insert into public.sector_rewards
    (sector_id, reward_code, title, reward_value, conditions, sort_order)
  select p_sector_id, reward_code, title, reward_value, conditions, sort_order
  from public.sector_rewards
  where sector_id = v_src
  on conflict (sector_id, reward_code) do nothing;
  get diagnostics v_rewards = row_count;

  return jsonb_build_object('laws', v_laws, 'rewards', v_rewards);
end;
$$;

-- 5.8 دوال RPC لا تُنفّذ إلا من service_role (السيرفر)
revoke all on function public.issue_certificate_number(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.check_login_allowed(text) from public, anon, authenticated;
revoke all on function public.record_failed_login(text) from public, anon, authenticated;
revoke all on function public.reset_login_attempts(text) from public, anon, authenticated;
revoke all on function public.seed_sector_defaults(uuid, text) from public, anon, authenticated;

grant execute on function public.issue_certificate_number(uuid, text, integer) to service_role;
grant execute on function public.check_login_allowed(text) to service_role;
grant execute on function public.record_failed_login(text) to service_role;
grant execute on function public.reset_login_attempts(text) to service_role;
grant execute on function public.seed_sector_defaults(uuid, text) to service_role;

-- ---------------------------------------------------------------------
-- 6) المشغّلات (updated_at)
-- ---------------------------------------------------------------------

drop trigger if exists trg_sectors_updated on public.sectors;
create trigger trg_sectors_updated before update on public.sectors
  for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_laws_updated on public.sector_laws;
create trigger trg_laws_updated before update on public.sector_laws
  for each row execute function public.set_updated_at();

drop trigger if exists trg_rewards_updated on public.sector_rewards;
create trigger trg_rewards_updated before update on public.sector_rewards
  for each row execute function public.set_updated_at();

drop trigger if exists trg_courses_updated on public.courses;
create trigger trg_courses_updated before update on public.courses
  for each row execute function public.set_updated_at();

drop trigger if exists trg_tests_updated on public.tests;
create trigger trg_tests_updated before update on public.tests
  for each row execute function public.set_updated_at();

drop trigger if exists trg_recruitment_updated on public.recruitment_info;
create trigger trg_recruitment_updated before update on public.recruitment_info
  for each row execute function public.set_updated_at();

drop trigger if exists trg_announcements_updated on public.announcements;
create trigger trg_announcements_updated before update on public.announcements
  for each row execute function public.set_updated_at();

drop trigger if exists trg_schedules_updated on public.sector_schedules;
create trigger trg_schedules_updated before update on public.sector_schedules
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 7) RLS والسياسات
-- ---------------------------------------------------------------------

alter table public.sectors enable row level security;
alter table public.profiles enable row level security;
alter table public.sector_laws enable row level security;
alter table public.sector_rewards enable row level security;
alter table public.courses enable row level security;
alter table public.tests enable row level security;
alter table public.questions enable row level security;
alter table public.choices enable row level security;
alter table public.test_attempts enable row level security;
alter table public.test_answers enable row level security;
alter table public.certificate_counters enable row level security;
alter table public.certificates enable row level security;
alter table public.recruitment_info enable row level security;
alter table public.announcements enable row level security;
alter table public.sector_schedules enable row level security;
alter table public.audit_logs enable row level security;
alter table public.login_attempts enable row level security;
alter table public.member_xp enable row level security;
alter table public.notifications enable row level security;

-- 7.1 القطاعات: قراءة عامة، كتابة للمدير العام
drop policy if exists sectors_public_read on public.sectors;
create policy sectors_public_read on public.sectors
  for select using (true);

drop policy if exists sectors_super_write on public.sectors;
create policy sectors_super_write on public.sectors
  for all using (public.current_role_name() = 'super_admin')
  with check (public.current_role_name() = 'super_admin');

-- 7.2 الملفات الشخصية: كل مستخدم يرى ملفه، والمدير العام يرى الكل
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (
    id = auth.uid()
    or public.current_role_name() = 'super_admin'
    or (public.is_staff() and sector_id = public.current_sector_id())
  );

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- 7.3 القوانين
drop policy if exists laws_public_read on public.sector_laws;
create policy laws_public_read on public.sector_laws
  for select using (is_active or public.is_staff());

drop policy if exists laws_staff_write on public.sector_laws;
create policy laws_staff_write on public.sector_laws
  for all using (
    public.has_permission('laws.write')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  )
  with check (
    public.has_permission('laws.write')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

-- 7.4 المكافآت
drop policy if exists rewards_public_read on public.sector_rewards;
create policy rewards_public_read on public.sector_rewards
  for select using (is_active or public.is_staff());

drop policy if exists rewards_staff_write on public.sector_rewards;
create policy rewards_staff_write on public.sector_rewards
  for all using (
    public.has_permission('rewards.write')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  )
  with check (
    public.has_permission('rewards.write')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

-- 7.5 الدورات
drop policy if exists courses_public_read on public.courses;
create policy courses_public_read on public.courses
  for select using (
    (is_active and exists (select 1 from public.sectors s where s.id = courses.sector_id and s.is_active))
    or public.is_staff()
  );

drop policy if exists courses_staff_write on public.courses;
create policy courses_staff_write on public.courses
  for all using (
    public.has_permission('courses.write')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  )
  with check (
    public.has_permission('courses.write')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

-- 7.6 الاختبارات والأسئلة والخيارات: للطاقم فقط (الطلاب يمرون عبر API بالسيرفر)
drop policy if exists tests_staff_read on public.tests;
create policy tests_staff_read on public.tests
  for select using (
    public.is_staff()
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

drop policy if exists tests_staff_write on public.tests;
create policy tests_staff_write on public.tests
  for all using (
    public.has_permission('tests.write')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  )
  with check (
    public.has_permission('tests.write')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

drop policy if exists questions_staff_read on public.questions;
create policy questions_staff_read on public.questions
  for select using (
    public.is_staff() and exists (
      select 1 from public.tests t
      where t.id = questions.test_id
        and (public.current_role_name() = 'super_admin' or t.sector_id = public.current_sector_id())
    )
  );

drop policy if exists questions_staff_write on public.questions;
create policy questions_staff_write on public.questions
  for all using (
    public.has_permission('questions.write') and exists (
      select 1 from public.tests t
      where t.id = questions.test_id
        and (public.current_role_name() = 'super_admin' or t.sector_id = public.current_sector_id())
    )
  )
  with check (
    public.has_permission('questions.write') and exists (
      select 1 from public.tests t
      where t.id = questions.test_id
        and (public.current_role_name() = 'super_admin' or t.sector_id = public.current_sector_id())
    )
  );

drop policy if exists choices_staff_read on public.choices;
create policy choices_staff_read on public.choices
  for select using (
    public.is_staff() and exists (
      select 1 from public.questions q
      join public.tests t on t.id = q.test_id
      where q.id = choices.question_id
        and (public.current_role_name() = 'super_admin' or t.sector_id = public.current_sector_id())
    )
  );

drop policy if exists choices_staff_write on public.choices;
create policy choices_staff_write on public.choices
  for all using (
    public.has_permission('questions.write') and exists (
      select 1 from public.questions q
      join public.tests t on t.id = q.test_id
      where q.id = choices.question_id
        and (public.current_role_name() = 'super_admin' or t.sector_id = public.current_sector_id())
    )
  )
  with check (
    public.has_permission('questions.write') and exists (
      select 1 from public.questions q
      join public.tests t on t.id = q.test_id
      where q.id = choices.question_id
        and (public.current_role_name() = 'super_admin' or t.sector_id = public.current_sector_id())
    )
  );

-- 7.7 المحاولات والإجابات: قراءة للطاقم فقط (الكتابة عبر service_role)
drop policy if exists attempts_staff_read on public.test_attempts;
create policy attempts_staff_read on public.test_attempts
  for select using (
    public.has_permission('results.read')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

drop policy if exists answers_staff_read on public.test_answers;
create policy answers_staff_read on public.test_answers
  for select using (
    public.has_permission('results.read') and exists (
      select 1 from public.test_attempts a
      where a.id = test_answers.attempt_id
        and (public.current_role_name() = 'super_admin' or a.sector_id = public.current_sector_id())
    )
  );

-- 7.8 عدّاد الشهادات: لا وصول للعملاء إطلاقًا
-- (بلا سياسات = ممنوع للجميع؛ service_role يتجاوز RLS)

-- 7.9 الشهادات: التحقق العام مفتوح (بمعرفة الرقم)، والكتابة للسيرفر
drop policy if exists certificates_public_read on public.certificates;
create policy certificates_public_read on public.certificates
  for select using (true);

drop policy if exists certificates_admin_update on public.certificates;
create policy certificates_admin_update on public.certificates
  for update using (
    public.has_permission('certificates.revoke')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  )
  with check (
    public.has_permission('certificates.revoke')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

-- 7.10 التوظيف
drop policy if exists recruitment_public_read on public.recruitment_info;
create policy recruitment_public_read on public.recruitment_info
  for select using (true);

drop policy if exists recruitment_staff_write on public.recruitment_info;
create policy recruitment_staff_write on public.recruitment_info
  for all using (
    public.has_permission('recruitment.write')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  )
  with check (
    public.has_permission('recruitment.write')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

-- 7.11 الإعلانات
drop policy if exists announcements_public_read on public.announcements;
create policy announcements_public_read on public.announcements
  for select using (is_published or public.is_staff());

drop policy if exists announcements_staff_write on public.announcements;
create policy announcements_staff_write on public.announcements
  for all using (
    public.has_permission('announcements.write')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  )
  with check (
    public.has_permission('announcements.write')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

-- 7.12 الجداول
drop policy if exists schedules_public_read on public.sector_schedules;
create policy schedules_public_read on public.sector_schedules
  for select using (is_published or public.is_staff());

drop policy if exists schedules_staff_write on public.sector_schedules;
create policy schedules_staff_write on public.sector_schedules
  for all using (
    public.has_permission('schedule.write')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  )
  with check (
    public.has_permission('schedule.write')
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

-- 7.13 سجل العمليات: قراءة للمدير العام فقط
drop policy if exists audit_super_read on public.audit_logs;
create policy audit_super_read on public.audit_logs
  for select using (public.current_role_name() = 'super_admin');

-- 7.14 محاولات الدخول: لا وصول للعملاء
-- (بلا سياسات)

-- 7.15 XP والإشعارات (المراحل القادمة)
drop policy if exists xp_staff_read on public.member_xp;
create policy xp_staff_read on public.member_xp
  for select using (public.is_staff());

drop policy if exists notifications_self_read on public.notifications;
create policy notifications_self_read on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists notifications_self_update on public.notifications;
create policy notifications_self_update on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 8) التخزين
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certificates', 'certificates', true, 5242880, array['application/pdf'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('schedule-images', 'schedule-images', true, 4194304, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- قراءة عامة للملفات (الشهادات وصور الجداول تُشارك عبر روابط عامة)
drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select using (bucket_id in ('certificates', 'schedule-images'));

-- الرفع/الحذف يتم من السيرفر بمفتاح service_role (يتجاوز RLS)

-- ---------------------------------------------------------------------
-- 9) البيانات الأولية — القطاعات الخمسة
-- ---------------------------------------------------------------------

insert into public.sectors (slug, name, sector_code, description, primary_color, is_active)
values
  ('red-crescent', 'الهلال الأحمر', 'RCA', 'قطاع الهلال الأحمر بمحافظة الرس — الإسعاف والعمليات والمساندة الجوية.', '#c62828', true),
  ('mechanic-garage', 'الورشة الميكانيكية', 'MG', 'قطاع الورشة الميكانيكية — الصيانة والسلامة والفحص الفني.', '#e67e22', true),
  ('public-security', 'الأمن العام', 'PS', 'قطاع الأمن العام — الدوريات والتحقيق وحفظ النظام.', '#2980b9', true),
  ('facility-security', 'أمن المنشآت', 'FS', 'قطاع أمن المنشآت — حماية المنشآت الحيوية ونقاط التفتيش.', '#27ae60', true),
  ('security-brigades', 'الأفواج الأمنية', 'SB', 'قطاع الأفواج الأمنية — قطاع جديد يعمل بنظام Onboarding (بلا بيانات مسبقة).', '#8e44ad', true)
on conflict (slug) do update
  set name = excluded.name,
      sector_code = excluded.sector_code,
      description = excluded.description,
      primary_color = excluded.primary_color;

-- صفوف توظيف فارغة (مغلقة) للقطاعات — تُحرَّر من لوحة الإدارة
insert into public.recruitment_info (sector_id, is_open)
select id, false from public.sectors
on conflict (sector_id) do nothing;

-- =====================================================================
-- 10) إنشاء حسابات الإدارة الخمسة
-- =====================================================================
-- لا يمكن إنشاء مستخدمي auth.users من SQL مباشرة بشكل موثوق.
-- استخدم أحد الخيارين:
--
-- أ) Supabase Dashboard → Authentication → Users → Add user
--    ثم شغّل التالي لكل حساب لضبط الدور والقطاع:
--
--    update public.profiles
--      set role = 'sector_admin',
--          sector_id = (select id from public.sectors where slug = 'red-crescent'),
--          display_name = 'قائد الهلال الأحمر'
--      where id = (select id from auth.users where email = 'rca@ras.internal');
--
-- ب) أو من سكربت السيرفر باستخدام service_role:
--    admin.auth.admin.createUser({
--      email, password,
--      app_metadata: { sector_slug: 'red-crescent', role: 'sector_admin', display_name: '...' },
--      email_confirm: true
--    })
--
-- الحسابات المطلوبة (البريد → القطاع):
--   rca@ras.internal → red-crescent
--   mg@ras.internal  → mechanic-garage
--   ps@ras.internal  → public-security
--   fs@ras.internal  → facility-security
--   sb@ras.internal  → security-brigades
--
-- ملاحظة: ملف profiles يُنشأ تلقائيًا عند أول تسجيل دخول (lib/auth/actions.ts)،
-- لكن يُفضّل إنشاؤه مسبقًا عند إنشاء المستخدم.
-- =====================================================================

-- ---------------------------------------------------------------------
-- المراحل 8 – 13: الجداول والدوال والسياسات
-- يُطبَّق بعد supabase/schema.sql (أو يُلحق به).
-- آمن التكرار: كل الأوامر idempotent.
-- ---------------------------------------------------------------------

-- =====================================================================
-- المرحلة 8 — XP والمستويات
-- =====================================================================

create table if not exists public.xp_levels (
  level integer primary key,
  min_xp integer not null unique check (min_xp >= 0),
  title text not null
);

insert into public.xp_levels (level, min_xp, title) values
  (1, 0, 'متطوع'),
  (2, 500, 'متطوع أول'),
  (3, 1500, 'عنصر'),
  (4, 3000, 'عنصر أول'),
  (5, 6000, 'مشرف'),
  (6, 10000, 'قائد')
on conflict (level) do nothing;

create index if not exists idx_xp_events_discord on public.xp_events (discord_id, created_at desc);
create index if not exists idx_member_xp_sector on public.member_xp (sector_id, total_xp desc);

alter table public.member_xp enable row level security;
alter table public.xp_events enable row level security;
alter table public.xp_levels enable row level security;

drop policy if exists xp_levels_public_read on public.xp_levels;
create policy xp_levels_public_read on public.xp_levels for select using (true);

drop policy if exists xp_events_staff_read on public.xp_events;
create policy xp_events_staff_read on public.xp_events
  for select using (public.is_staff());

-- add_xp: إضافة/خصم نقاط ذرية + إعادة حساب المستوى
create or replace function public.add_xp(
  p_discord_id text,
  p_sector uuid,
  p_amount integer,
  p_reason text default null
)
returns public.member_xp
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.member_xp;
  v_level integer;
begin
  if p_discord_id is null or length(btrim(p_discord_id)) = 0 then
    raise exception 'discord_id مطلوب';
  end if;
  if p_amount is null or p_amount = 0 then
    raise exception 'قيمة النقاط يجب ألا تكون صفرًا';
  end if;

  insert into public.xp_events (discord_id, sector_id, amount, reason)
  values (p_discord_id, p_sector, p_amount, p_reason);

  insert into public.member_xp (discord_id, sector_id, total_xp, updated_at)
  values (p_discord_id, p_sector, greatest(p_amount, 0), now())
  on conflict (discord_id) do update
    set total_xp = greatest(0, public.member_xp.total_xp + p_amount),
        sector_id = coalesce(public.member_xp.sector_id, excluded.sector_id),
        updated_at = now()
  returning * into v_row;

  select coalesce(max(level), 1) into v_level
  from public.xp_levels
  where min_xp <= v_row.total_xp;

  update public.member_xp set level = v_level where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.add_xp(text, uuid, integer, text) from public;
grant execute on function public.add_xp(text, uuid, integer, text) to service_role;

-- =====================================================================
-- المرحلة 9 — الحضور والانصراف
-- =====================================================================

alter table public.attendance_records
  add column if not exists attendance_date date;

update public.attendance_records
set attendance_date = (checked_in_at at time zone 'Asia/Riyadh')::date
where attendance_date is null;

alter table public.attendance_records
  alter column attendance_date set default ((now() at time zone 'Asia/Riyadh')::date),
  alter column attendance_date set not null;

create unique index if not exists uq_attendance_member_day
  on public.attendance_records (discord_id, attendance_date);
create index if not exists idx_attendance_sector_day
  on public.attendance_records (sector_id, attendance_date);

alter table public.attendance_records enable row level security;

drop policy if exists attendance_staff_read on public.attendance_records;
create policy attendance_staff_read on public.attendance_records
  for select using (
    public.is_staff()
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

drop policy if exists attendance_staff_write on public.attendance_records;
create policy attendance_staff_write on public.attendance_records
  for all using (
    public.is_staff()
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  ) with check (
    public.is_staff()
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

create or replace function public.mark_attendance(
  p_sector uuid,
  p_discord_id text,
  p_date date,
  p_status text,
  p_note text default null
)
returns public.attendance_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.attendance_records;
begin
  if p_discord_id is null or length(btrim(p_discord_id)) = 0 then
    raise exception 'discord_id مطلوب';
  end if;
  if p_status not in ('present', 'late', 'absent', 'excused') then
    raise exception 'حالة حضور غير معروفة: %', p_status;
  end if;

  insert into public.attendance_records
    (sector_id, discord_id, status, attendance_date, checked_in_at, note)
  values
    (p_sector, p_discord_id, p_status, coalesce(p_date, current_date), now(), p_note)
  on conflict (discord_id, attendance_date) do update
    set status = excluded.status,
        sector_id = coalesce(excluded.sector_id, public.attendance_records.sector_id),
        note = excluded.note,
        checked_in_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.mark_attendance(uuid, text, date, text, text) from public;
grant execute on function public.mark_attendance(uuid, text, date, text, text) to service_role;

-- =====================================================================
-- المرحلة 10 — الرتب والترقيات
-- =====================================================================

create table if not exists public.ranks (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors (id) on delete cascade,
  code text not null,
  title text not null,
  sort_order integer not null default 0,
  min_xp integer not null default 0,
  requirements jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (sector_id, code)
);

create table if not exists public.member_ranks (
  id uuid primary key default gen_random_uuid(),
  discord_id text not null,
  rank_id uuid not null references public.ranks (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users (id) on delete set null,
  unique (discord_id, rank_id)
);

alter table public.promotions
  add column if not exists status text not null default 'pending',
  add column if not exists note text,
  add column if not exists requested_by uuid references auth.users (id) on delete set null,
  add column if not exists decided_by uuid references auth.users (id) on delete set null,
  add column if not exists decided_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'promotions_status_check'
  ) then
    alter table public.promotions
      add constraint promotions_status_check
      check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

create index if not exists idx_promotions_sector on public.promotions (sector_id, created_at desc);
create index if not exists idx_ranks_sector on public.ranks (sector_id, sort_order);

alter table public.ranks enable row level security;
alter table public.member_ranks enable row level security;
alter table public.promotions enable row level security;

drop policy if exists ranks_public_read on public.ranks;
create policy ranks_public_read on public.ranks for select using (true);

drop policy if exists ranks_staff_write on public.ranks;
create policy ranks_staff_write on public.ranks
  for all using (
    public.is_staff()
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  ) with check (
    public.is_staff()
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

drop policy if exists member_ranks_staff_read on public.member_ranks;
create policy member_ranks_staff_read on public.member_ranks
  for select using (public.is_staff());

drop policy if exists promotions_staff_read on public.promotions;
create policy promotions_staff_read on public.promotions
  for select using (
    public.is_staff()
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

drop policy if exists promotions_staff_write on public.promotions;
create policy promotions_staff_write on public.promotions
  for all using (
    public.is_staff()
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  ) with check (
    public.is_staff()
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

-- =====================================================================
-- المرحلة 11 — متجر النقاط
-- =====================================================================

create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid references public.sectors (id) on delete set null,
  item_id uuid not null references public.store_items (id) on delete cascade,
  discord_id text not null,
  price_paid integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'fulfilled', 'cancelled')),
  fulfilled_by uuid references auth.users (id) on delete set null,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_store_orders_sector on public.store_orders (sector_id, created_at desc);
create index if not exists idx_store_items_sector on public.store_items (sector_id, is_active);

alter table public.store_items enable row level security;
alter table public.store_orders enable row level security;

drop policy if exists store_items_public_read on public.store_items;
create policy store_items_public_read on public.store_items
  for select using (is_active or public.is_staff());

drop policy if exists store_items_staff_write on public.store_items;
create policy store_items_staff_write on public.store_items
  for all using (
    public.is_staff()
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  ) with check (
    public.is_staff()
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

drop policy if exists store_orders_staff_read on public.store_orders;
create policy store_orders_staff_read on public.store_orders
  for select using (
    public.is_staff()
    and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
  );

-- purchase_item: خصم الرصيد + المخزون + إنشاء الطلب في معاملة واحدة
create or replace function public.purchase_item(
  p_item_id uuid,
  p_discord_id text
)
returns public.store_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.store_items;
  v_balance integer;
  v_order public.store_orders;
begin
  if p_discord_id is null or length(btrim(p_discord_id)) = 0 then
    raise exception 'discord_id مطلوب';
  end if;

  select * into v_item from public.store_items where id = p_item_id for update;
  if not found then
    raise exception 'العنصر غير موجود';
  end if;
  if not v_item.is_active then
    raise exception 'العنصر غير متاح للشراء';
  end if;
  if v_item.stock is not null and v_item.stock <= 0 then
    raise exception 'نفد المخزون';
  end if;

  select coalesce(total_xp, 0) into v_balance
  from public.member_xp
  where discord_id = p_discord_id;

  if coalesce(v_balance, 0) < v_item.price then
    raise exception 'الرصيد غير كافٍ (المطلوب % من % )', v_item.price, coalesce(v_balance, 0);
  end if;

  if v_item.price > 0 then
    perform public.add_xp(p_discord_id, v_item.sector_id, -v_item.price, 'store_purchase');
  end if;

  if v_item.stock is not null then
    update public.store_items set stock = v_item.stock - 1 where id = v_item.id;
  end if;

  insert into public.store_orders (sector_id, item_id, discord_id, price_paid, status)
  values (v_item.sector_id, v_item.id, p_discord_id, v_item.price, 'pending')
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.purchase_item(uuid, text) from public;
grant execute on function public.purchase_item(uuid, text) to service_role;

create or replace function public.cancel_store_order(p_order_id uuid)
returns public.store_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.store_orders;
  v_item public.store_items;
begin
  select * into v_order from public.store_orders where id = p_order_id for update;
  if not found then
    raise exception 'الطلب غير موجود';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'لا يمكن إلغاء طلب حالته %', v_order.status;
  end if;

  select * into v_item from public.store_items where id = v_order.item_id;
  if v_item.stock is not null then
    update public.store_items set stock = v_item.stock + 1 where id = v_item.id;
  end if;
  if v_order.price_paid > 0 then
    perform public.add_xp(v_order.discord_id, v_order.sector_id, v_order.price_paid, 'store_refund');
  end if;

  update public.store_orders set status = 'cancelled' where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.cancel_store_order(uuid) from public;
grant execute on function public.cancel_store_order(uuid) to service_role;

-- =====================================================================
-- المرحلة 12 — Discord
-- =====================================================================

create index if not exists idx_discord_events_sector on public.discord_events (sector_id, created_at desc);

alter table public.discord_events enable row level security;

drop policy if exists discord_events_staff_read on public.discord_events;
create policy discord_events_staff_read on public.discord_events
  for select using (public.is_staff());

-- =====================================================================
-- المرحلة 13 — الإشعارات
-- =====================================================================

create index if not exists idx_notifications_user on public.notifications (user_id, is_read, created_at desc);
create index if not exists idx_notifications_sector on public.notifications (sector_id, created_at desc);

-- notify_sector: إشعار كل طاقم قطاع (أو كل الطاقم عند p_sector = null)
create or replace function public.notify_sector(
  p_sector uuid,
  p_title text,
  p_body text default null,
  p_href text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_title is null or length(btrim(p_title)) = 0 then
    raise exception 'عنوان الإشعار مطلوب';
  end if;

  insert into public.notifications (sector_id, user_id, title, body, href)
  select p_sector, p.id, p_title, p_body, p_href
  from public.profiles p
  where p.is_active
    and (p_sector is null or p.sector_id = p_sector);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.notify_sector(uuid, text, text, text) from public;
grant execute on function public.notify_sector(uuid, text, text, text) to service_role;

-- =====================================================================
-- الصلاحيات: إضافة صلاحيات المراحل 8 – 13 إلى دالة القاعدة
-- =====================================================================

create or replace function public.role_permissions(p_role text)
returns text[]
language sql
immutable
as $$
  select case p_role
    when 'super_admin' then array[
      'laws.read','laws.write','laws.delete','rewards.write','courses.write',
      'questions.write','tests.write','results.read','results.review',
      'certificates.read','certificates.revoke','schedule.write',
      'announcements.write','recruitment.write','audit.read','sector.seed',
      'members.read','members.write','attendance.read','attendance.write',
      'promotions.read','promotions.write','store.read','store.write',
      'discord.read','notifications.write'
    ]
    when 'sector_admin' then array[
      'laws.read','laws.write','laws.delete','rewards.write','courses.write',
      'questions.write','tests.write','results.read','results.review',
      'certificates.read','certificates.revoke','schedule.write',
      'announcements.write','recruitment.write','sector.seed',
      'members.read','members.write','attendance.read','attendance.write',
      'promotions.read','promotions.write','store.read','store.write',
      'discord.read','notifications.write'
    ]
    when 'sector_vice' then array[
      'laws.read','laws.write','rewards.write','courses.write',
      'questions.write','tests.write','results.read','results.review',
      'certificates.read','certificates.revoke','schedule.write',
      'announcements.write','recruitment.write',
      'members.read','attendance.read','attendance.write',
      'promotions.read','store.read','discord.read'
    ]
    when 'sector_trainer' then array[
      'laws.read','courses.write','questions.write','tests.write',
      'members.read','attendance.read','attendance.write'
    ]
    when 'sector_reviewer' then array[
      'laws.read','results.read','results.review','certificates.read',
      'members.read','promotions.read'
    ]
    else array[]::text[]
  end;
$$;
