-- Fix top_scorers view to count goals scored with power cards (penalty, shootout, goalx2, starplayer, joker)
drop view if exists public.top_scorers cascade;

create or replace view public.top_scorers as
select
  p.id as player_id,
  p.name as player_name,
  t.name as team_name,
  count(e.id) as goals
from public.players p
join public.teams t on p.team_id = t.id
left join public.match_events e on p.id = e.player_id and (
  e.type = 'GOAL' OR (
    e.type = 'CARTA' AND (
      e.detail IN ('starplayer', 'goalx2') OR 
      e.detail LIKE '%::success'
    )
  )
)
group by p.id, p.name, t.name
having count(e.id) > 0
order by goals desc, player_name asc;

grant select on public.top_scorers to anon, authenticated;
