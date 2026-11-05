-- =====================================================================
-- جداول المواصفة المتبقية (§4.6، §4.8، §4.10) — بنية جاهزة للتعبئة
-- تُنشأ فارغة، مع RLS. جميع الكتابات من service_role عبر Server Actions.
-- =====================================================================

-- §4.8 — الأسئلة الشائعة (مركز المساعدة)
create table if not exists public.faq (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid references public.sectors(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order int default 0,
  is_published boolean default true
);

-- §4.5 — محاولات التدريب (بلا شهادة ولا نقاط)
create table if not exists public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid references public.sectors(id) on delete cascade,
  test_id uuid references public.tests(id) on delete set null,
  discord_id text,
  score int default 0,
  percentage numeric(5,2) default 0,
  submitted_at timestamptz default now()
);

-- §4.6 — توقيعات الشهادة (المرحلة 11)
create table if not exists public.certificate_signatures (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid references public.certificates(id) on delete cascade,
  signer_name text not null,
  signer_role text not null,
  signature_url text,
  signed_at timestamptz default now()
);

-- §4.8 — الفعاليات (المرحلة 13)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid references public.sectors(id) on delete cascade,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  is_published boolean default true
);

-- §4.10 — إصدارات المستندات (المرحلة 13)
create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  version int not null,
  content jsonb not null,
  changed_by uuid references public.profiles(id),
  change_note text,
  created_at timestamptz default now()
);

-- §4.10 — تكامل FiveM (المرحلة 12)
create table if not exists public.fivem_integration (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid references public.sectors(id) on delete cascade,
  api_url text,
  api_key text,
  is_active boolean default false
);

-- §4.10 — التقارير المجدولة (المرحلة 10)
create table if not exists public.scheduled_reports (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid references public.sectors(id) on delete cascade,
  type text not null,
  email_recipients text[],
  format text default 'pdf',
  is_active boolean default false
);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.faq enable row level security;
alter table public.practice_attempts enable row level security;
alter table public.certificate_signatures enable row level security;
alter table public.events enable row level security;
alter table public.document_versions enable row level security;
alter table public.fivem_integration enable row level security;
alter table public.scheduled_reports enable row level security;

drop policy if exists faq_public_read on public.faq;
create policy faq_public_read on public.faq for select using (is_published = true);

drop policy if exists faq_staff_all on public.faq;
create policy faq_staff_all on public.faq for all using (
  public.has_permission('faq.write')
  and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
) with check (
  public.has_permission('faq.write')
  and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
);

drop policy if exists practice_staff_read on public.practice_attempts;
create policy practice_staff_read on public.practice_attempts for select using (
  public.has_permission('results.read')
  and (public.current_role_name() = 'super_admin' or sector_id = public.current_sector_id())
);

drop policy if exists signatures_public_read on public.certificate_signatures;
create policy signatures_public_read on public.certificate_signatures for select using (true);

drop policy if exists events_public_read on public.events;
create policy events_public_read on public.events for select using (is_published = true);

drop policy if exists document_versions_super on public.document_versions;
create policy document_versions_super on public.document_versions for select using (
  public.has_permission('audit.read')
);

drop policy if exists fivem_super on public.fivem_integration;
create policy fivem_super on public.fivem_integration for select using (
  public.has_permission('audit.read')
);

drop policy if exists reports_super on public.scheduled_reports;
create policy reports_super on public.scheduled_reports for select using (
  public.has_permission('audit.read')
);

-- ---------------------------------------------------------------------
-- توسيع قائمة الصلاحيات في القاعدة لصفحة الأسئلة الشائعة
-- ---------------------------------------------------------------------
create or replace function public.role_permissions(p_role text)
returns text[]
language sql
immutable
as $function$
  select case p_role
    when 'super_admin' then array[
      'laws.read','laws.write','laws.delete','rewards.write','courses.write',
      'questions.write','tests.write','results.read','results.review',
      'certificates.read','certificates.revoke','schedule.write',
      'announcements.write','recruitment.write','audit.read','sector.seed',
      'members.read','members.write','attendance.read','attendance.write',
      'promotions.read','promotions.write','store.read','store.write',
      'discord.read','notifications.write','faq.write'
    ]
    when 'sector_admin' then array[
      'laws.read','laws.write','laws.delete','rewards.write','courses.write',
      'questions.write','tests.write','results.read','results.review',
      'certificates.read','certificates.revoke','schedule.write',
      'announcements.write','recruitment.write','sector.seed',
      'members.read','members.write','attendance.read','attendance.write',
      'promotions.read','promotions.write','store.read','store.write',
      'discord.read','notifications.write','faq.write'
    ]
    when 'sector_vice' then array[
      'laws.read','laws.write','rewards.write','courses.write',
      'questions.write','tests.write','results.read','results.review',
      'certificates.read','certificates.revoke','schedule.write',
      'announcements.write','recruitment.write','faq.write',
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
$function$;
