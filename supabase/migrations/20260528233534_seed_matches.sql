-- Lunedì 22
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-22 19:30:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'FC Pontos' and a.name = 'Amatori Calcio Genova';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-22 20:05:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'Gli Umili' and a.name = 'Sezione 164';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-22 20:40:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'FC Ceres' and a.name = 'FC Murta';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-22 21:15:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'Sezione 164' and a.name = 'Amatori Calcio Genova';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-22 21:50:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'FC Murta' and a.name = 'FC Pontos';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-22 22:25:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'FC Ceres' and a.name = 'Gli Umili';

-- Martedì 23
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-23 18:55:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'UCG' and a.name = 'Gilly Boys';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-23 19:30:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'Taverna FC' and a.name = 'Aston Birra';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-23 20:05:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'Pontex Pirates' and a.name = 'Lo Dico FC';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-23 20:40:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'Gilly Boys' and a.name = 'San Teodoro Ketzmaja';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-23 21:15:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'Chainz' and a.name = 'Taverna FC';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-23 21:50:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'Aston Birra' and a.name = 'UCG';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-23 22:25:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'San Teodoro Ketzmaja' and a.name = 'Pontex Pirates';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-23 23:00:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'Lo Dico FC' and a.name = 'Chainz';

-- Mercoledì 24
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-24 18:55:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'Gli Umili' and a.name = 'Lo Dico FC';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-24 19:30:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'FC Murta' and a.name = 'Chainz';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-24 20:05:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'San Teodoro Ketzmaja' and a.name = 'FC Ceres';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-24 20:40:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'Aston Birra' and a.name = 'Lo Dico FC';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-24 21:15:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'Gli Umili' and a.name = 'UCG';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-24 21:50:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'San Teodoro Ketzmaja' and a.name = 'Chainz';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-24 22:25:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'FC Murta' and a.name = 'Aston Birra';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-24 23:00:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'FC Ceres' and a.name = 'UCG';

-- Giovedì 25
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-25 19:30:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'Sezione 164' and a.name = 'Gilly Boys';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-25 20:05:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'Pontex Pirates' and a.name = 'Amatori Calcio Genova';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-25 20:40:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'FC Pontos' and a.name = 'Taverna FC';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-25 21:15:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'Sezione 164' and a.name = 'Pontex Pirates';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-25 21:50:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'FC Pontos' and a.name = 'Gilly Boys';
insert into public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
select h.id, a.id, '2026-06-25 22:25:00+02'::timestamptz, 'Fase a Gironi', 'PROSSIMA', null, null from public.teams h, public.teams a where h.name = 'Amatori Calcio Genova' and a.name = 'Taverna FC';
