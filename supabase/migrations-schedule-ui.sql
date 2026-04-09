-- =============================================
-- 일정 종료 시간 추가
-- Supabase SQL Editor에서 실행하세요
-- =============================================

alter table public.schedules
  add column if not exists end_time text;
