-- teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- players
create table public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- matches
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  home_team_id uuid references public.teams(id) on delete cascade not null,
  away_team_id uuid references public.teams(id) on delete cascade not null,
  match_date timestamp with time zone not null,
  round text not null,
  status text not null default 'PROSSIMA', -- PROSSIMA, LIVE, TERMINATA
  home_score integer default 0 not null,
  away_score integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- match_events
create table public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade not null,
  player_id uuid references public.players(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null,
  minute integer not null,
  type text not null, -- GOAL, YELLOW_CARD, RED_CARD, POWER_CARD
  detail text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- mvp_votes
create table public.mvp_votes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade not null,
  voter_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_events enable row level security;
alter table public.mvp_votes enable row level security;

-- Policies for public reading
create policy "Public read access for teams" on public.teams for select using (true);
create policy "Public read access for players" on public.players for select using (true);
create policy "Public read access for matches" on public.matches for select using (true);
create policy "Public read access for match_events" on public.match_events for select using (true);
create policy "Public read access for mvp_votes" on public.mvp_votes for select using (true);

-- Policy to allow anonymous users to insert mvp_votes
create policy "Anonymous users can insert mvp_votes" on public.mvp_votes for insert with check (true);

-- Realtime Setup
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.match_events;
alter publication supabase_realtime add table public.mvp_votes;
