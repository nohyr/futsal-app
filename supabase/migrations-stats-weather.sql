-- =============================================
-- 팀 전적 통계 + 구장 좌표 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. 팀 전적 통계 함수
create or replace function public.get_team_match_stats(p_team_id uuid)
returns table(
  total_matches bigint,
  wins bigint,
  draws bigint,
  losses bigint,
  win_rate numeric,
  total_scored bigint,
  total_conceded bigint,
  avg_scored numeric,
  avg_conceded numeric,
  recent_matches jsonb
)
language sql
stable
security definer
as $$
  with matches as (
    select id, title, date, opponent, our_score, their_score,
      case
        when our_score > their_score then 'win'
        when our_score = their_score then 'draw'
        else 'loss'
      end as result
    from public.records
    where team_id = p_team_id
      and type = 'match'
      and our_score is not null
      and their_score is not null
    order by date desc
  ),
  stats as (
    select
      count(*) as total_matches,
      count(case when result = 'win' then 1 end) as wins,
      count(case when result = 'draw' then 1 end) as draws,
      count(case when result = 'loss' then 1 end) as losses,
      case when count(*) > 0
        then round(count(case when result = 'win' then 1 end)::numeric / count(*) * 100)
        else 0
      end as win_rate,
      coalesce(sum(our_score), 0) as total_scored,
      coalesce(sum(their_score), 0) as total_conceded,
      case when count(*) > 0
        then round(sum(our_score)::numeric / count(*), 1)
        else 0
      end as avg_scored,
      case when count(*) > 0
        then round(sum(their_score)::numeric / count(*), 1)
        else 0
      end as avg_conceded
    from matches
  ),
  recent as (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'id', id,
        'date', date,
        'opponent', opponent,
        'our_score', our_score,
        'their_score', their_score,
        'result', result
      )
    ), '[]'::jsonb) as recent_matches
    from (select * from matches limit 5) sub
  )
  select
    s.total_matches, s.wins, s.draws, s.losses, s.win_rate,
    s.total_scored, s.total_conceded, s.avg_scored, s.avg_conceded,
    r.recent_matches
  from stats s, recent r
$$;
