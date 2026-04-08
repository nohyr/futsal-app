-- =============================================
-- 지출 내역 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. expenses (지출 내역)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  amount numeric not null,
  category text default 'venue' check (category in ('venue', 'equipment', 'food', 'uniform', 'etc')),
  month text,
  date date,
  description text,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- 2. 인덱스
create index if not exists idx_expenses_team on public.expenses(team_id);
create index if not exists idx_expenses_month on public.expenses(month);
create index if not exists idx_expenses_date on public.expenses(date);

-- 3. RLS
alter table public.expenses enable row level security;

create policy "expenses_select" on public.expenses
  for select using (public.is_team_member(team_id));
create policy "expenses_insert" on public.expenses
  for insert with check (public.is_team_admin(team_id));
create policy "expenses_update" on public.expenses
  for update using (public.is_team_admin(team_id));
create policy "expenses_delete" on public.expenses
  for delete using (public.is_team_admin(team_id));

-- 4. 월별 수입/지출/잔액 요약 함수 (기존 함수 교체)
create or replace function public.get_monthly_fee_summary(p_team_id uuid, p_month text)
returns table(
  total_amount numeric,
  paid_amount numeric,
  unpaid_amount numeric,
  total_items bigint,
  paid_count bigint,
  total_payments bigint,
  payment_rate numeric,
  total_expenses numeric,
  balance numeric
)
language sql
stable
security definer
as $$
  with income as (
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
  ),
  expense as (
    select coalesce(sum(amount), 0) as total_expenses
    from public.expenses
    where team_id = p_team_id
      and (p_month is null or month = p_month)
  )
  select
    i.total_amount, i.paid_amount, i.unpaid_amount,
    i.total_items, i.paid_count, i.total_payments, i.payment_rate,
    e.total_expenses,
    i.paid_amount - e.total_expenses as balance
  from income i, expense e
$$;
