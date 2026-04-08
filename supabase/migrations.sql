-- =============================================
-- 출석 체크 강화 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. attendances 테이블에 실제 출석 필드 추가
alter table public.attendances
  add column if not exists checked_in boolean default false,
  add column if not exists checked_in_at timestamptz,
  add column if not exists is_no_show boolean default false;

-- 2. 인덱스 추가
create index if not exists idx_attendances_user on public.attendances(user_id);
create index if not exists idx_attendances_checked on public.attendances(checked_in);

-- 3. RLS 정책: admin만 출석 체크 필드 업데이트 가능
-- 기존 update 정책 삭제 후 재생성
drop policy if exists "attendances_update_own" on public.attendances;

-- 본인 투표 상태(status) 업데이트
create policy "attendances_update_own_vote" on public.attendances
  for update using (user_id = public.get_my_user_id())
  with check (user_id = public.get_my_user_id());

-- admin 출석 체크 업데이트 (checked_in, is_no_show)
create policy "attendances_admin_checkin" on public.attendances
  for update using (
    exists(
      select 1 from public.schedules s
      where s.id = schedule_id
      and public.is_team_admin(s.team_id)
    )
  );

-- 4. 출석률 계산용 DB 함수
create or replace function public.get_attendance_stats(p_team_id uuid)
returns table(
  user_id uuid,
  user_name text,
  profile_image text,
  total_events bigint,
  attended bigint,
  no_shows bigint,
  attendance_rate numeric
)
language sql
stable
security definer
as $$
  select
    u.id as user_id,
    u.name as user_name,
    u.profile_image,
    count(a.id) as total_events,
    count(case when a.checked_in = true then 1 end) as attended,
    count(case when a.is_no_show = true then 1 end) as no_shows,
    case
      when count(a.id) > 0
      then round(count(case when a.checked_in = true then 1 end)::numeric / count(a.id) * 100)
      else 0
    end as attendance_rate
  from public.team_members tm
  join public.users u on u.id = tm.user_id
  left join public.attendances a on a.user_id = tm.user_id
    and a.schedule_id in (
      select s.id from public.schedules s
      where s.team_id = p_team_id
      and s.date <= current_date
    )
  where tm.team_id = p_team_id
  group by u.id, u.name, u.profile_image
$$;
