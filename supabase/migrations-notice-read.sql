-- =============================================
-- 공지 읽음 확인 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. notice_reads 테이블 생성
create table if not exists public.notice_reads (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  read_at timestamptz default now(),
  unique(notice_id, user_id)
);

-- 2. 인덱스
create index if not exists idx_notice_reads_notice on public.notice_reads(notice_id);
create index if not exists idx_notice_reads_user on public.notice_reads(user_id);

-- 3. RLS
alter table public.notice_reads enable row level security;

-- 팀원이면 읽음 기록 조회 가능
create policy "notice_reads_select" on public.notice_reads
  for select using (
    exists(
      select 1 from public.notices n
      where n.id = notice_id
      and public.is_team_member(n.team_id)
    )
  );

-- 본인 읽음만 기록 가능
create policy "notice_reads_insert" on public.notice_reads
  for insert with check (user_id = public.get_my_user_id());

-- 4. 공지별 읽음 통계 함수 (관리자용)
create or replace function public.get_notice_read_stats(p_notice_id uuid)
returns table(
  total_members bigint,
  read_count bigint,
  read_rate numeric,
  unread_users jsonb
)
language sql
stable
security definer
as $$
  with notice_team as (
    select team_id from public.notices where id = p_notice_id
  ),
  members as (
    select tm.user_id, u.name, u.profile_image
    from public.team_members tm
    join public.users u on u.id = tm.user_id
    where tm.team_id = (select team_id from notice_team)
  ),
  reads as (
    select user_id from public.notice_reads where notice_id = p_notice_id
  )
  select
    (select count(*) from members) as total_members,
    (select count(*) from reads) as read_count,
    case
      when (select count(*) from members) > 0
      then round((select count(*) from reads)::numeric / (select count(*) from members) * 100)
      else 0
    end as read_rate,
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'user_id', m.user_id,
        'name', m.name,
        'profile_image', m.profile_image
      )), '[]'::jsonb)
      from members m
      where m.user_id not in (select user_id from reads)
    ) as unread_users
$$;
