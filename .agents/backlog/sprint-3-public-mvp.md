# Sprint 3: Integrazione Hub Pubblico con Supabase

**Branch:** `sprint-3-public-mvp`

## Obiettivi
1. Collegare la scheda e la modale del voto MVP di `HubIsland.tsx` al database reale di Supabase.
2. Sostituire l'elenco dei candidati mockati caricando dinamicamente i giocatori salvati in `mvp_candidates`.
3. Sostituire il sistema di voto locale con inserimenti reali nella tabella `mvp_votes`.
4. Gestire la prevenzione dei voti duplicati:
   - Generare un `voter_id` univoco in `localStorage` se non già presente.
   - Controllare a ogni avvio se il `voter_id` ha già espresso una preferenza nel database.
   - Mostrare le barre percentuali dei voti reali in tempo reale.
   - Consentire la modifica del voto ("Cambia voto") rimuovendo il vecchio voto e inserendo il nuovo.

## Specifiche Tecniche
- Modificare [HubIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/HubIsland.tsx):
  - Sostituire `CANDIDATES` statici con una query `supabase.from('mvp_candidates').select('player:players(id, name, team:teams(id, name))')`.
  - Calcolare i voti totali ed espressi per ogni candidato facendo una query a `mvp_votes`.
  - Sincronizzare il voto dell'utente tramite `voter_id` persistito in `localStorage`.
