-- =============================================
-- 푸시 알림 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. users 테이블에 push_token 추가
alter table public.users
  add column if not exists push_token text;

-- 2. notifications 테이블 생성 (앱 내 알림 목록)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in (
    'new_notice', 'schedule_reminder', 'new_comment',
    'new_like', 'attendance_request', 'notice_pinned',
    'new_post', 'new_schedule'
  )),
  title text not null,
  body text not null,
  data jsonb default '{}',
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 3. 인덱스
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(user_id, is_read);
create index if not exists idx_users_push_token on public.users(push_token) where push_token is not null;

-- 4. RLS
alter table public.notifications enable row level security;

-- 본인 알림만 조회
create policy "notifications_select_own" on public.notifications
  for select using (user_id = public.get_my_user_id());

-- 본인 알림만 읽음 처리
create policy "notifications_update_own" on public.notifications
  for update using (user_id = public.get_my_user_id());

-- 인증된 사용자가 알림 생성 가능 (서버에서 호출)
create policy "notifications_insert" on public.notifications
  for insert with check (auth.uid() is not null);

-- 5. push_token 업데이트 허용 (기존 users_update_own 정책으로 커버)

-- 6. 푸시 알림 발송용 DB 함수
-- 팀원들의 push_token 목록 조회
create or replace function public.get_team_push_tokens(
  p_team_id uuid,
  p_exclude_user_id uuid default null
)
returns table(user_id uuid, push_token text)
language sql
stable
security definer
as $$
  select u.id as user_id, u.push_token
  from public.team_members tm
  join public.users u on u.id = tm.user_id
  where tm.team_id = p_team_id
    and u.push_token is not null
    and (p_exclude_user_id is null or u.id != p_exclude_user_id)
$$;
