-- Policies for authenticated users (Admin)

-- teams
create policy "Admin full access to teams" on public.teams
for all to authenticated
using (true)
with check (true);

-- players
create policy "Admin full access to players" on public.players
for all to authenticated
using (true)
with check (true);

-- matches
create policy "Admin full access to matches" on public.matches
for all to authenticated
using (true)
with check (true);

-- match_events
create policy "Admin full access to match_events" on public.match_events
for all to authenticated
using (true)
with check (true);

-- mvp_votes
create policy "Admin full access to mvp_votes" on public.mvp_votes
for all to authenticated
using (true)
with check (true);
