-- =============================================
-- 회비 장부 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. fee_items (회비 항목)
create table if not exists public.fee_items (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  amount numeric not null,
  category text default 'monthly' check (category in ('monthly', 'special', 'penalty')),
  month text,
  description text,
  created_at timestamptz default now()
);

-- 2. fee_payments (팀원별 납부 현황)
create table if not exists public.fee_payments (
  id uuid primary key default gen_random_uuid(),
  fee_item_id uuid not null references public.fee_items(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  is_paid boolean default false,
  paid_at timestamptz,
  memo text,
  created_at timestamptz default now(),
  unique(fee_item_id, user_id)
);

-- 3. 인덱스
create index if not exists idx_fee_items_team on public.fee_items(team_id);
create index if not exists idx_fee_items_month on public.fee_items(month);
create index if not exists idx_fee_payments_fee on public.fee_payments(fee_item_id);
create index if not exists idx_fee_payments_user on public.fee_payments(user_id);
create index if not exists idx_fee_payments_paid on public.fee_payments(is_paid);

-- 4. RLS
alter table public.fee_items enable row level security;
alter table public.fee_payments enable row level security;

-- fee_items: 팀원 조회, admin만 생성/수정/삭제
create policy "fee_items_select" on public.fee_items
  for select using (public.is_team_member(team_id));
create policy "fee_items_insert" on public.fee_items
  for insert with check (public.is_team_admin(team_id));
create policy "fee_items_update" on public.fee_items
  for update using (public.is_team_admin(team_id));
create policy "fee_items_delete" on public.fee_items
  for delete using (public.is_team_admin(team_id));

-- fee_payments: 팀원 조회, admin만 납부 상태 변경
create policy "fee_payments_select" on public.fee_payments
  for select using (
    exists(select 1 from public.fee_items where id = fee_item_id and public.is_team_member(team_id))
  );
create policy "fee_payments_insert" on public.fee_payments
  for insert with check (
    exists(select 1 from public.fee_items where id = fee_item_id and public.is_team_admin(team_id))
  );
create policy "fee_payments_update" on public.fee_payments
  for update using (
    exists(select 1 from public.fee_items where id = fee_item_id and public.is_team_admin(team_id))
  );

-- 5. 월별 요약 함수
create or replace function public.get_monthly_fee_summary(p_team_id uuid, p_month text)
returns table(
  total_amount numeric,
  paid_amount numeric,
  unpaid_amount numeric,
  total_items bigint,
  paid_count bigint,
  total_payments bigint,
  payment_rate numeric
)
language sql
stable
security definer
as $$
  select
    coalesce(sum(fi.amount), 0) as total_amount,
    coalesce(sum(case when fp.is_paid then fi.amount else 0 end), 0) as paid_amount,
    coalesce(sum(case when not fp.is_paid then fi.amount else 0 end), 0) as unpaid_amount,
    count(distinct fi.id) as total_items,
    count(case when fp.is_paid then 1 end) as paid_count,
    count(fp.id) as total_payments,
    case
      when count(fp.id) > 0
      then round(count(case when fp.is_paid then 1 end)::numeric / count(fp.id) * 100)
      else 0
    end as payment_rate
  from public.fee_items fi
  left join public.fee_payments fp on fp.fee_item_id = fi.id
  where fi.team_id = p_team_id
    and (p_month is null or fi.month = p_month)
$$;
