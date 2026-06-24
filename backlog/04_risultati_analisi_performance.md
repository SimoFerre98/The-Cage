# Risultati dell'Analisi delle Performance e Proposte di Ottimizzazione

Abbiamo condotto un'analisi approfondita delle prestazioni dell'applicazione su quattro fronti: database (indici e RLS), front-end (Astro hydration e React re-renders), asset (dimensioni immagini) e strategie di caching (Service Worker).

I risultati mostrano alcune importanti aree di miglioramento, in particolare a livello di indici mancanti nel database e nell'uso di immagini pesanti non ottimizzate.

---

## 1. Database & Query Performance (Priorità: CRITICA)

### Problema: Indici mancanti su tutte le chiavi esterne (Foreign Keys)
Postgres non crea automaticamente indici sulle colonne con vincolo di Foreign Key. Eseguendo un'analisi dei metadati del database, è emerso che **nessuna** delle tabelle pubbliche possiede indici sulle chiavi esterne. 

**Conseguenze:**
- Tutte le operazioni di `JOIN` tra partite, eventi, giocatori e squadre (es. nel calcolo della classifica o dei capocannonieri) eseguono una scansione sequenziale dell'intera tabella (`Seq Scan`), rallentando man mano che il database cresce.
- Le eliminazioni con cancellazione a cascata (`ON DELETE CASCADE`) devono scansionare interamente le tabelle per trovare le righe correlate, bloccando le tabelle interessate.

### Soluzione Proposta
Creare indici specifici per tutte le chiavi esterne delle tabelle pubbliche:

```sql
-- Indici per velocizzare i JOIN e le operazioni di cascade
CREATE INDEX IF NOT EXISTS players_team_id_idx ON public.players (team_id);
CREATE INDEX IF NOT EXISTS matches_home_team_id_idx ON public.matches (home_team_id);
CREATE INDEX IF NOT EXISTS matches_away_team_id_idx ON public.matches (away_team_id);
CREATE INDEX IF NOT EXISTS match_events_match_id_idx ON public.match_events (match_id);
CREATE INDEX IF NOT EXISTS match_events_player_id_idx ON public.match_events (player_id);
CREATE INDEX IF NOT EXISTS match_events_team_id_idx ON public.match_events (team_id);
CREATE INDEX IF NOT EXISTS mvp_votes_match_id_idx ON public.mvp_votes (match_id);
CREATE INDEX IF NOT EXISTS mvp_votes_player_id_idx ON public.mvp_votes (player_id);
```

---

## 2. Ottimizzazione degli Asset (Priorità: ALTA)

### Problema A: Incoerenza e dimensione del logo del torneo
Nel file `public/` sono presenti due versioni del logo del torneo:
- `Logo_Torneo.png`: **1.7 Megabyte** (non ottimizzato)
- `Logo_Torneo.webp`: **140 Kilobyte** (ottimizzato)

L'analisi mostra che quasi tutte le pagine e il layout principale continuano a importare e precaricare la versione PNG da 1.7 MB anziché quella ottimizzata in WebP. Inoltre, il Service Worker (`sw.js`) pre-carica la versione WebP, ma non la versione PNG, il che significa che il browser scarica l'immagine da 1.7 MB sulla rete ignorando la cache del service worker!

**File interessati:**
- `src/components/HomeIsland.tsx` (riga 405)
- `src/layouts/Layout.astro` (righe 29, 31, 76, 92, 113)

### Problema B: Dimensioni dei loghi delle squadre
I loghi delle squadre salvati in `public/Logos/` sono tutti in formato PNG e hanno dimensioni comprese tra **110 KB e 465 KB ciascuno** (es. `murta.png` è 465 KB). Moltiplicato per le 14 squadre, il caricamento della lista squadre richiede il download di oltre **3.8 MB** di immagini per loghi che vengono visualizzati in cerchi da 40-60 pixel.

### Soluzione Proposta
1. Sostituire tutte le ricorrenze di `Logo_Torneo.png` con `Logo_Torneo.webp` nel codice Astro e React.
2. Comprimere e convertire tutti i loghi delle squadre in formato `.webp` riducendone la risoluzione massima a 256x256 pixel. Questo ridurrà la dimensione di ciascun logo a meno di **15-20 KB** (risparmio del 95% di banda).

---

## 3. Hydration & Caricamento delle Isole (Priorità: MEDIA)

### Problema: Uso di `client:load` su componenti pesanti
Nel layout e in alcune pagine principali viene utilizzato `client:load` per caricare e idratare i componenti React immediatamente all'avvio della pagina.
- `index.astro` usa `HomeIsland client:load`.
- `live.astro` usa `LiveMatchIsland client:load`.

**Conseguenze:**
Il browser deve bloccare il rendering e scaricare, parsare ed eseguire l'intero bundle React prima di mostrare gli elementi o renderli interattivi, penalizzando le metriche di velocità sui dispositivi mobili.

### Soluzione Proposta
1. In `index.astro`, modificare `HomeIsland client:load` in `client:visible` o `client:idle`. Questo posticipa l'inizializzazione React a dopo che la pagina è stata renderizzata.
2. Dividere i layout: per componenti puramente visivi (es. intestazioni, grafiche fisse del sito) evitare React e utilizzare componenti Astro nativi (`.astro`) che compilano a zero-JS.

---

## Prossimi Passi (Roadmap di Ottimizzazione)

1. **Sprint 1 (Database)**: Creare e applicare la migrazione SQL per inserire gli indici delle chiavi esterne.
2. **Sprint 2 (Asset)**: Modificare i riferimenti al logo del torneo in `.webp` e convertire i loghi delle squadre in WebP.
3. **Sprint 3 (Hydration)**: Ottimizzare le direttive di caricamento in Astro (`client:visible` su HomeIsland).
