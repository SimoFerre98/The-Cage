# Sprint 9: Aggregazione Ottimizzata Voti MVP e Gestione Realtime

**Branch:** `sprint-9-mvp-votes-aggregation`

## Obiettivi (INVEST)
1. **Indipendente**: Migliora l'algoritmo di conteggio dei voti e le sottoscrizioni realtime senza impattare le altre parti dell'applicazione o della classifica.
2. **Negoziabile**: L'aggregazione può essere implementata come vista SQL Postgres o come funzione RPC (Remote Procedure Call) a seconda della complessità delle autorizzazioni RLS.
3. **Di Valore (Valuable)**: Risolve il problema del traffico quadratico ($O(N^2)$). Invece di far scaricare a tutti gli utenti centinaia o migliaia di righe di voti grezzi ad ogni voto espresso, scarica solo una manciata di record già aggregati (es. 5-10 righe, una per candidato).
4. **Stimabile**: Richiede la scrittura di una migrazione o vista SQL in Supabase e l'aggiornamento del client JS.
5. **Piccolo (Small)**: Incentrato sulla query dei voti MVP.
6. **Testabile**: Votare da più browser simulando accessi concorrenti e misurare le dimensioni dei payload di rete.

### Checklist
- [ ] Creare una vista SQL o una funzione RPC in Supabase (es. `mvp_votes_summary`) che calcoli il conteggio dei voti per ciascun candidato (`candidate_id`, `vote_count`) direttamente sul server Postgres.
- [ ] Modificare la funzione `loadVotes` in [HomeIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/HomeIsland.tsx) e [MVPManager.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/admin/MVPManager.tsx) per interrogare la vista/RPC aggregata.
- [ ] Ottimizzare la gestione dei canali Realtime: quando un voto viene inserito, aggiornare il contatore locale nello stato di React incrementando/decrementando di 1, evitando di effettuare una chiamata `SELECT` completa al database.

## Specifiche Tecniche
- Esempio di vista SQL consigliata:
  ```sql
  create or replace view public.mvp_votes_summary as
  select player_id, count(id) as vote_count
  from public.mvp_votes
  group by player_id;
  ```
- Assicurarsi che le politiche RLS (Row Level Security) consentano l'accesso in lettura alla nuova vista per gli utenti anonimi.
