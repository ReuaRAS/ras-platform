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
