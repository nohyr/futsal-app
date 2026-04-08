-- =============================================
-- Row Level Security Policies
-- Supabase SQL Editor에서 schema.sql 이후 실행
-- =============================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.schedules enable row level security;
alter table public.attendances enable row level security;
alter table public.notices enable row level security;
alter table public.records enable row level security;

-- =============================================
-- Users
-- =============================================
create policy "users_select" on public.users for select using (true);
create policy "users_update_own" on public.users for update using (auth_id = auth.uid());

-- =============================================
-- Teams: 누구나 조회, 인증된 사용자가 생성
-- =============================================
create policy "teams_select" on public.teams for select using (true);
create policy "teams_insert" on public.teams for insert with check (auth.uid() is not null);
create policy "teams_update_admin" on public.teams for update using (public.is_team_admin(id));

-- =============================================
-- Team Members: 팀원만 조회, 본인이 가입/탈퇴
-- =============================================
create policy "members_select" on public.team_members for select using (public.is_team_member(team_id));
create policy "members_insert" on public.team_members for insert with check (user_id = public.get_my_user_id());
create policy "members_delete_own" on public.team_members for delete using (user_id = public.get_my_user_id());
create policy "members_update_admin" on public.team_members for update using (public.is_team_admin(team_id));

-- =============================================
-- Posts: 팀원만 CRUD
-- =============================================
create policy "posts_select" on public.posts for select using (public.is_team_member(team_id));
create policy "posts_insert" on public.posts for insert with check (
  public.is_team_member(team_id) and author_id = public.get_my_user_id()
);
create policy "posts_update_own" on public.posts for update using (author_id = public.get_my_user_id());
create policy "posts_delete_own" on public.posts for delete using (author_id = public.get_my_user_id());

-- =============================================
-- Comments: 팀원이 작성, 본인만 삭제
-- =============================================
create policy "comments_select" on public.comments for select using (
  exists(select 1 from public.posts where id = post_id and public.is_team_member(team_id))
);
create policy "comments_insert" on public.comments for insert with check (
  author_id = public.get_my_user_id()
);
create policy "comments_delete_own" on public.comments for delete using (author_id = public.get_my_user_id());

-- =============================================
-- Likes: 팀원이 토글
-- =============================================
create policy "likes_select" on public.likes for select using (
  exists(select 1 from public.posts where id = post_id and public.is_team_member(team_id))
);
create policy "likes_insert" on public.likes for insert with check (user_id = public.get_my_user_id());
create policy "likes_delete_own" on public.likes for delete using (user_id = public.get_my_user_id());

-- =============================================
-- Schedules: 팀원만 CRUD
-- =============================================
create policy "schedules_select" on public.schedules for select using (public.is_team_member(team_id));
create policy "schedules_insert" on public.schedules for insert with check (public.is_team_member(team_id));
create policy "schedules_update" on public.schedules for update using (public.is_team_admin(team_id));
create policy "schedules_delete" on public.schedules for delete using (public.is_team_admin(team_id));

-- =============================================
-- Attendances: 팀원이 본인 투표
-- =============================================
create policy "attendances_select" on public.attendances for select using (
  exists(select 1 from public.schedules where id = schedule_id and public.is_team_member(team_id))
);
create policy "attendances_upsert" on public.attendances for insert with check (user_id = public.get_my_user_id());
create policy "attendances_update_own" on public.attendances for update using (user_id = public.get_my_user_id());

-- =============================================
-- Notices: 팀원 조회, admin만 생성/수정/삭제
-- =============================================
create policy "notices_select" on public.notices for select using (public.is_team_member(team_id));
create policy "notices_insert" on public.notices for insert with check (public.is_team_admin(team_id));
create policy "notices_update" on public.notices for update using (public.is_team_admin(team_id));
create policy "notices_delete" on public.notices for delete using (public.is_team_admin(team_id));

-- =============================================
-- Records: 팀원만 CRUD
-- =============================================
create policy "records_select" on public.records for select using (public.is_team_member(team_id));
create policy "records_insert" on public.records for insert with check (public.is_team_member(team_id));
create policy "records_update" on public.records for update using (public.is_team_member(team_id));
create policy "records_delete" on public.records for delete using (public.is_team_admin(team_id));

-- =============================================
-- Storage bucket for videos/images
-- =============================================
insert into storage.buckets (id, name, public) values ('media', 'media', true);

create policy "media_select" on storage.objects for select using (bucket_id = 'media');
create policy "media_insert" on storage.objects for insert with check (
  bucket_id = 'media' and auth.uid() is not null
);
create policy "media_delete_own" on storage.objects for delete using (
  bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
);
