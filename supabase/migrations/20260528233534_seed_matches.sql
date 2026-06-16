insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-05-19 21:00:00+02'::timestamptz, 'Girone A', 'TERMINATA', 4, 2
from public.teams h, public.teams a where h.name = 'Gli Umili' and a.name = 'Tama';

insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-05-19 21:30:00+02'::timestamptz, 'Girone A', 'TERMINATA', 3, 1
from public.teams h, public.teams a where h.name = 'Amatori Calcio Genova' and a.name = 'Sezione 104';

insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-05-21 21:00:00+02'::timestamptz, 'Girone A', 'TERMINATA', 2, 2
from public.teams h, public.teams a where h.name = 'Dario' and a.name = 'UCG (Bairon)';

insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-05-21 21:30:00+02'::timestamptz, 'Girone A', 'TERMINATA', 1, 3
from public.teams h, public.teams a where h.name = 'Taverna' and a.name = 'Mario';

insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-05-22 21:00:00+02'::timestamptz, 'Girone B', 'TERMINATA', 5, 2
from public.teams h, public.teams a where h.name = 'Samu Betti' and a.name = 'chainz Andrea Robbiano';

insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-05-22 21:30:00+02'::timestamptz, 'Girone B', 'TERMINATA', 0, 2
from public.teams h, public.teams a where h.name = 'Martino Gonzalez' and a.name = 'Gli Umili';

insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-05-26 21:00:00+02'::timestamptz, 'Girone A', 'PROSSIMA', 0, 0
from public.teams h, public.teams a where h.name = 'Tama' and a.name = 'Sezione 104';

insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-05-28 21:30:00+02'::timestamptz, 'Girone A', 'LIVE', 2, 1
from public.teams h, public.teams a where h.name = 'Amatori Calcio Genova' and a.name = 'Gli Umili';

insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-05-28 21:00:00+02'::timestamptz, 'Girone B', 'PROSSIMA', 0, 0
from public.teams h, public.teams a where h.name = 'UCG (Bairon)' and a.name = 'Samu Betti';

insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-05-28 21:30:00+02'::timestamptz, 'Girone B', 'PROSSIMA', 0, 0
from public.teams h, public.teams a where h.name = 'chainz Andrea Robbiano' and a.name = 'Mario';
