-- View for top assists (Assistman)
create or replace view public.top_assists as
select
  p.id as player_id,
  p.name as player_name,
  t.name as team_name,
  count(e.id)::integer as assists
from public.players p
join public.teams t on p.team_id = t.id
left join public.match_events e on p.id = e.player_id and e.type = 'ASSIST'
group by p.id, p.name, t.name
having count(e.id) > 0
order by assists desc, player_name asc;

grant select on public.top_assists to anon, authenticated;

-- View for top cards (Sanzioni)
create or replace view public.top_cards as
select
  p.id as player_id,
  p.name as player_name,
  t.name as team_name,
  sum(case when e.type = 'AMMONIZIONE' then 1 else 0 end)::integer as yellow_cards,
  sum(case when e.type = 'ESPULSIONE' then 1 else 0 end)::integer as red_cards
from public.players p
join public.teams t on p.team_id = t.id
left join public.match_events e on p.id = e.player_id and e.type in ('AMMONIZIONE', 'ESPULSIONE')
group by p.id, p.name, t.name
having count(e.id) > 0
order by red_cards desc, yellow_cards desc, player_name asc;

grant select on public.top_cards to anon, authenticated;
