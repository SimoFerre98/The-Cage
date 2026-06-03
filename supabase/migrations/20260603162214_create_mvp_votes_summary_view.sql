-- Create mvp_votes_summary view to aggregate vote counts by player_id
create or replace view public.mvp_votes_summary as
select player_id, count(id)::integer as vote_count
from public.mvp_votes
group by player_id;

-- Grant select permission to anonymous and authenticated users
grant select on public.mvp_votes_summary to anon, authenticated;
