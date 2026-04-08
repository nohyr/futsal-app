-- =============================================
-- 풋살메이트 Supabase Schema
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. Users (Supabase Auth와 연결)
create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique references auth.users(id) on delete cascade,
  kakao_id text unique,
  name text not null,
  profile_image text,
  created_at timestamptz default now()
);

-- 2. Teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  logo text,
  invite_code text unique not null,
  home_ground text default '',
  founded_date date default current_date,
  created_at timestamptz default now()
);

-- 3. Team Members
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  role text default 'member' check (role in ('admin', 'member')),
  number int default 0,
  position text default 'FP' check (position in ('GK', 'FP')),
  goals int default 0,
  assists int default 0,
  joined_at timestamptz default now(),
  unique(user_id, team_id)
);

-- 4. Posts (영상, 기록, 피드백)
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('video', 'record', 'feedback')),
  title text not null,
  content text not null,
  video_url text,
  thumbnail_url text,
  video_duration text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- 6. Likes
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- 7. Schedules (경기, 훈련, 모임)
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  type text not null check (type in ('match', 'training', 'gathering')),
  date date not null,
  time text not null,
  location text not null,
  opponent text,
  description text,
  created_at timestamptz default now()
);

-- 8. Attendances (출석 투표)
create table public.attendances (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text default 'pending' check (status in ('attending', 'not_attending', 'maybe', 'pending')),
  updated_at timestamptz default now(),
  unique(schedule_id, user_id)
);

-- 9. Notices (공지사항)
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  content text not null,
  category text default 'general' check (category in ('general', 'schedule', 'location', 'fee', 'uniform')),
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 10. Records (경기/훈련 기록)
create table public.records (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  type text not null check (type in ('match', 'training')),
  title text not null,
  date date not null,
  location text not null,
  opponent text,
  our_score int,
  their_score int,
  memo text,
  created_at timestamptz default now()
);

-- =============================================
-- Indexes
-- =============================================
create index idx_team_members_user on public.team_members(user_id);
create index idx_team_members_team on public.team_members(team_id);
create index idx_posts_team on public.posts(team_id);
create index idx_posts_created on public.posts(created_at desc);
create index idx_comments_post on public.comments(post_id);
create index idx_likes_post on public.likes(post_id);
create index idx_schedules_team_date on public.schedules(team_id, date);
create index idx_attendances_schedule on public.attendances(schedule_id);
create index idx_notices_team on public.notices(team_id);
create index idx_records_team on public.records(team_id);

-- =============================================
-- Helper function: get current user's public.users.id
-- =============================================
create or replace function public.get_my_user_id()
returns uuid
language sql
stable
security definer
as $$
  select id from public.users where auth_id = auth.uid()
$$;

-- Helper: check if user is team member
create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1 from public.team_members
    where team_id = p_team_id
    and user_id = public.get_my_user_id()
  )
$$;

-- Helper: check if user is team admin
create or replace function public.is_team_admin(p_team_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1 from public.team_members
    where team_id = p_team_id
    and user_id = public.get_my_user_id()
    and role = 'admin'
  )
$$;
