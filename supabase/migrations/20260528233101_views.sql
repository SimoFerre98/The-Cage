-- View for standings (Classifica)
create or replace view public.standings as
with team_stats as (
  select
    t.id as team_id,
    t.name as team_name,
    count(m.id) as g,
    sum(case 
      when m.home_team_id = t.id and m.home_score > m.away_score then 1
      when m.away_team_id = t.id and m.away_score > m.home_score then 1
      else 0 end) as v,
    sum(case when m.home_score = m.away_score then 1 else 0 end) as n,
    sum(case 
      when m.home_team_id = t.id and m.home_score < m.away_score then 1
      when m.away_team_id = t.id and m.away_score < m.home_score then 1
      else 0 end) as p,
    sum(case when m.home_team_id = t.id then m.home_score else m.away_score end) as gf,
    sum(case when m.home_team_id = t.id then m.away_score else m.home_score end) as gs
  from public.teams t
  left join public.matches m on (t.id = m.home_team_id or t.id = m.away_team_id) and m.status = 'TERMINATA'
  group by t.id, t.name
)
select
  team_id,
  team_name,
  coalesce(g, 0) as g,
  coalesce(v, 0) as v,
  coalesce(n, 0) as n,
  coalesce(p, 0) as p,
  coalesce(gf, 0) as gf,
  coalesce(gs, 0) as gs,
  coalesce((v * 3 + n * 1), 0) as pt
from team_stats
order by pt desc, (coalesce(gf, 0) - coalesce(gs, 0)) desc, coalesce(gf, 0) desc;

-- View for top scorers (Marcatori)
create or replace view public.top_scorers as
select
  p.id as player_id,
  p.name as player_name,
  t.name as team_name,
  count(e.id) as goals
from public.players p
join public.teams t on p.team_id = t.id
left join public.match_events e on p.id = e.player_id and e.type = 'GOAL'
group by p.id, p.name, t.name
having count(e.id) > 0
order by goals desc, player_name asc;
