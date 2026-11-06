-- ---------------------------------------------------------------------
-- كوادر القطاعات: جدول موحّد لكل قطاع + حقول خاصة يضيفها مدير القطاع
-- آمن التكرار: كل الأوامر idempotent.
-- ---------------------------------------------------------------------

-- حقول إضافية خاصة بالقطاع (مثل: تصنيع، التعديل والتزويد، مدرب معتمد)
create table if not exists public.sector_roster_fields (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors (id) on delete cascade,
  label text not null,
  kind text not null default 'bool' check (kind in ('bool', 'text')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (sector_id, label)
);

-- صفوف الكوادر
create table if not exists public.sector_roster_rows (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors (id) on delete cascade,
  code text,
  employee_no text,
  full_name text not null,
  level text,
  rank_title text,
  job_arc text,
  notes text,
  status text,
  extras jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_roster_rows_sector on public.sector_roster_rows (sector_id, position, full_name);
create index if not exists idx_roster_rows_search on public.sector_roster_rows (sector_id, employee_no);
create index if not exists idx_roster_fields_sector on public.sector_roster_fields (sector_id, position);

drop trigger if exists trg_roster_rows_updated on public.sector_roster_rows;
create trigger trg_roster_rows_updated
  before update on public.sector_roster_rows
  for each row execute function public.set_updated_at();

-- الوصول عبر عميل الخدمة من لوحة الإدارة فقط؛ القراءة لطاقم القطاع
alter table public.sector_roster_rows enable row level security;
alter table public.sector_roster_fields enable row level security;

drop policy if exists roster_rows_staff_read on public.sector_roster_rows;
create policy roster_rows_staff_read on public.sector_roster_rows
  for select using (
    public.is_staff()
    and (public.current_sector_id() is null or sector_id = public.current_sector_id())
  );

drop policy if exists roster_fields_staff_read on public.sector_roster_fields;
create policy roster_fields_staff_read on public.sector_roster_fields
  for select using (
    public.is_staff()
    and (public.current_sector_id() is null or sector_id = public.current_sector_id())
  );

-- الحقول الخاصة الافتراضية لقطاع الكراج (تُبنى من نموذج الجدول المعتمد)
insert into public.sector_roster_fields (sector_id, label, kind, position)
select s.id, f.label, 'bool', f.pos
from public.sectors s
cross join (values
  ('تصنيع', 1),
  ('التعديل والتزويد', 2),
  ('مدرب معتمد', 3),
  ('موجه الميداني', 4)
) as f (label, pos)
where s.slug = 'mechanic-garage'
on conflict (sector_id, label) do nothing;
