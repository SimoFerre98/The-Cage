-- Create indexes for foreign keys to optimize JOINs and ON DELETE CASCADE operations
CREATE INDEX IF NOT EXISTS players_team_id_idx ON public.players (team_id);
CREATE INDEX IF NOT EXISTS matches_home_team_id_idx ON public.matches (home_team_id);
CREATE INDEX IF NOT EXISTS matches_away_team_id_idx ON public.matches (away_team_id);
CREATE INDEX IF NOT EXISTS match_events_match_id_idx ON public.match_events (match_id);
CREATE INDEX IF NOT EXISTS match_events_player_id_idx ON public.match_events (player_id);
CREATE INDEX IF NOT EXISTS match_events_team_id_idx ON public.match_events (team_id);
CREATE INDEX IF NOT EXISTS mvp_votes_match_id_idx ON public.mvp_votes (match_id);
CREATE INDEX IF NOT EXISTS mvp_votes_player_id_idx ON public.mvp_votes (player_id);
