-- 1. Rendi nullable home_team_id e away_team_id per consentire segnaposto delle finali
ALTER TABLE public.matches ALTER COLUMN home_team_id DROP NOT NULL;
ALTER TABLE public.matches ALTER COLUMN away_team_id DROP NOT NULL;

-- 2. Ricrea la vista standings per escludere i match della fase finale (filtrando per 'Fase a Gironi')
CREATE OR REPLACE VIEW public.standings AS
WITH team_stats AS (
  SELECT
    t.id AS team_id,
    t.name AS team_name,
    COUNT(m.id) AS g,
    SUM(CASE 
      WHEN m.home_team_id = t.id AND m.home_score > m.away_score THEN 1
      WHEN m.away_team_id = t.id AND m.away_score > m.home_score THEN 1
      ELSE 0 END) AS v,
    SUM(CASE WHEN m.home_score = m.away_score THEN 1 ELSE 0 END) AS n,
    SUM(CASE 
      WHEN m.home_team_id = t.id AND m.home_score < m.away_score THEN 1
      WHEN m.away_team_id = t.id AND m.away_score < m.home_score THEN 1
      ELSE 0 END) AS p,
    SUM(CASE WHEN m.home_team_id = t.id THEN m.home_score ELSE m.away_score END) AS gf,
    SUM(CASE WHEN m.home_team_id = t.id THEN m.away_score ELSE m.home_score END) AS gs
  FROM public.teams t
  LEFT JOIN public.matches m ON (t.id = m.home_team_id OR t.id = m.away_team_id) 
    AND m.status = 'TERMINATA' 
    AND m.round = 'Fase a Gironi'
  GROUP BY t.id, t.name
)
SELECT
  team_id,
  team_name,
  COALESCE(g, 0) AS g,
  COALESCE(v, 0) AS v,
  COALESCE(n, 0) AS n,
  COALESCE(p, 0) AS p,
  COALESCE(gf, 0) AS gf,
  COALESCE(gs, 0) AS gs,
  COALESCE((v * 3 + n * 1), 0) AS pt
FROM team_stats
ORDER BY pt DESC, (COALESCE(gf, 0) - COALESCE(gs, 0)) DESC, COALESCE(gf, 0) DESC;

GRANT SELECT ON public.standings TO anon, authenticated;

-- 3. Inserisci i Quarti di Finale, Semifinali e Finale per oggi (venerdì 26 giugno 2026)
-- Quarti 1: Sezione 164 vs San Teodoro Ketzmaja (19:30)
INSERT INTO public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
VALUES (
  (SELECT id FROM public.teams WHERE name = 'Sezione 164'),
  (SELECT id FROM public.teams WHERE name = 'San Teodoro Ketzmaja'),
  '2026-06-26 19:30:00+02'::timestamptz,
  'Quarti 1',
  'PROSSIMA',
  0,
  0
);

-- Quarti 2: Taverna FC vs FC Pontos (20:00)
INSERT INTO public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
VALUES (
  (SELECT id FROM public.teams WHERE name = 'Taverna FC'),
  (SELECT id FROM public.teams WHERE name = 'FC Pontos'),
  '2026-06-26 20:00:00+02'::timestamptz,
  'Quarti 2',
  'PROSSIMA',
  0,
  0
);

-- Quarti 3: UCG vs Gli Umili (20:30)
INSERT INTO public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
VALUES (
  (SELECT id FROM public.teams WHERE name = 'UCG'),
  (SELECT id FROM public.teams WHERE name = 'Gli Umili'),
  '2026-06-26 20:30:00+02'::timestamptz,
  'Quarti 3',
  'PROSSIMA',
  0,
  0
);

-- Quarti 4: Gilly Boys vs Chainz (21:00)
INSERT INTO public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
VALUES (
  (SELECT id FROM public.teams WHERE name = 'Gilly Boys'),
  (SELECT id FROM public.teams WHERE name = 'Chainz'),
  '2026-06-26 21:00:00+02'::timestamptz,
  'Quarti 4',
  'PROSSIMA',
  0,
  0
);

-- Semifinale 1: segnaposto NULL vs NULL (21:45)
INSERT INTO public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
VALUES (
  NULL,
  NULL,
  '2026-06-26 21:45:00+02'::timestamptz,
  'Semifinale 1',
  'PROSSIMA',
  0,
  0
);

-- Semifinale 2: segnaposto NULL vs NULL (22:15)
INSERT INTO public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
VALUES (
  NULL,
  NULL,
  '2026-06-26 22:15:00+02'::timestamptz,
  'Semifinale 2',
  'PROSSIMA',
  0,
  0
);

-- Finale: segnaposto NULL vs NULL (23:00)
INSERT INTO public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
VALUES (
  NULL,
  NULL,
  '2026-06-26 23:00:00+02'::timestamptz,
  'Finale',
  'PROSSIMA',
  0,
  0
);

-- 4. Funzione Trigger per il passaggio automatico del turno
CREATE OR REPLACE FUNCTION public.fn_advance_bracket_winner()
RETURNS TRIGGER AS $$
DECLARE
  v_winner_id UUID;
  v_round TEXT;
BEGIN
  -- CASO 1: Il match passa a 'TERMINATA' oppure viene aggiornato il punteggio/squadra di un match già 'TERMINATA'
  IF NEW.status = 'TERMINATA' AND (
    (OLD.status IS NULL OR OLD.status != 'TERMINATA') OR
    (NEW.home_score != OLD.home_score OR NEW.away_score != OLD.away_score OR NEW.home_team_id IS DISTINCT FROM OLD.home_team_id OR NEW.away_team_id IS DISTINCT FROM OLD.away_team_id)
  ) THEN
    -- Calcola il vincitore (nei knockout non sono possibili pareggi terminati)
    IF NEW.home_score > NEW.away_score THEN
      v_winner_id := NEW.home_team_id;
    ELSIF NEW.away_score > NEW.home_score THEN
      v_winner_id := NEW.away_team_id;
    ELSE
      -- In caso di pareggio temporaneo, attendiamo la risoluzione
      RETURN NEW;
    END IF;
    
    v_round := LOWER(NEW.round);
    
    -- Quarti 1 (QF1) -> Vincitore va a Semifinale 1 (Home Team)
    IF v_round = 'quarti 1' THEN
      UPDATE public.matches
      SET home_team_id = v_winner_id
      WHERE LOWER(round) = 'semifinale 1' AND match_date >= '2026-06-26 00:00:00+02'::timestamptz;
      
    -- Quarti 3 (QF3) -> Vincitore va a Semifinale 1 (Away Team)
    ELSIF v_round = 'quarti 3' THEN
      UPDATE public.matches
      SET away_team_id = v_winner_id
      WHERE LOWER(round) = 'semifinale 1' AND match_date >= '2026-06-26 00:00:00+02'::timestamptz;
      
    -- Quarti 2 (QF2) -> Vincitore va a Semifinale 2 (Home Team)
    ELSIF v_round = 'quarti 2' THEN
      UPDATE public.matches
      SET home_team_id = v_winner_id
      WHERE LOWER(round) = 'semifinale 2' AND match_date >= '2026-06-26 00:00:00+02'::timestamptz;
      
    -- Quarti 4 (QF4) -> Vincitore va a Semifinale 2 (Away Team)
    ELSIF v_round = 'quarti 4' THEN
      UPDATE public.matches
      SET away_team_id = v_winner_id
      WHERE LOWER(round) = 'semifinale 2' AND match_date >= '2026-06-26 00:00:00+02'::timestamptz;
      
    -- Semifinale 1 (SF1) -> Vincitore va a Finale (Home Team)
    ELSIF v_round = 'semifinale 1' THEN
      UPDATE public.matches
      SET home_team_id = v_winner_id
      WHERE LOWER(round) = 'finale' AND match_date >= '2026-06-26 00:00:00+02'::timestamptz;
      
    -- Semifinale 2 (SF2) -> Vincitore va a Finale (Away Team)
    ELSIF v_round = 'semifinale 2' THEN
      UPDATE public.matches
      SET away_team_id = v_winner_id
      WHERE LOWER(round) = 'finale' AND match_date >= '2026-06-26 00:00:00+02'::timestamptz;
    END IF;
  
  -- CASO 2: Il match era 'TERMINATA' ma viene riaperto (riportato a 'PROSSIMA' o 'LIVE')
  ELSIF NEW.status != 'TERMINATA' AND OLD.status = 'TERMINATA' THEN
    v_round := LOWER(NEW.round);
    
    -- Rimuovi il team dal turno successivo impostando a NULL
    IF v_round = 'quarti 1' THEN
      UPDATE public.matches
      SET home_team_id = NULL
      WHERE LOWER(round) = 'semifinale 1' AND match_date >= '2026-06-26 00:00:00+02'::timestamptz;
    ELSIF v_round = 'quarti 3' THEN
      UPDATE public.matches
      SET away_team_id = NULL
      WHERE LOWER(round) = 'semifinale 1' AND match_date >= '2026-06-26 00:00:00+02'::timestamptz;
    ELSIF v_round = 'quarti 2' THEN
      UPDATE public.matches
      SET home_team_id = NULL
      WHERE LOWER(round) = 'semifinale 2' AND match_date >= '2026-06-26 00:00:00+02'::timestamptz;
    ELSIF v_round = 'quarti 4' THEN
      UPDATE public.matches
      SET away_team_id = NULL
      WHERE LOWER(round) = 'semifinale 2' AND match_date >= '2026-06-26 00:00:00+02'::timestamptz;
    ELSIF v_round = 'semifinale 1' THEN
      UPDATE public.matches
      SET home_team_id = NULL
      WHERE LOWER(round) = 'finale' AND match_date >= '2026-06-26 00:00:00+02'::timestamptz;
    ELSIF v_round = 'semifinale 2' THEN
      UPDATE public.matches
      SET away_team_id = NULL
      WHERE LOWER(round) = 'finale' AND match_date >= '2026-06-26 00:00:00+02'::timestamptz;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_advance_bracket ON public.matches;
CREATE TRIGGER trg_advance_bracket
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_advance_bracket_winner();
