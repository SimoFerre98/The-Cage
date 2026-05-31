-- Create mvp_candidates table
create table public.mvp_candidates (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.mvp_candidates enable row level security;

-- Policies for mvp_candidates
create policy "Public read access for mvp_candidates" on public.mvp_candidates
  for select using (true);

create policy "Admin full access to mvp_candidates" on public.mvp_candidates
  for all to authenticated
  using (true)
  with check (true);

-- Enable realtime for mvp_candidates
alter publication supabase_realtime add table public.mvp_candidates;

-- Add policy to allow anonymous users to delete their own votes (so they can change vote)
create policy "Anonymous users can delete mvp_votes" on public.mvp_votes
  for delete using (true);
