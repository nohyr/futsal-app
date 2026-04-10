-- =============================================
-- 공지 카테고리에 "newmember" 추가
-- Supabase SQL Editor에서 실행하세요
-- =============================================

ALTER TABLE public.notices DROP CONSTRAINT IF EXISTS notices_category_check;
ALTER TABLE public.notices ADD CONSTRAINT notices_category_check
  CHECK (category IN ('general', 'schedule', 'location', 'fee', 'uniform', 'newmember'));
