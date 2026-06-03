# Sprint 7: Caching SWR su Calendario e Home Page

**Branch:** `sprint-7-swr-calendario-home`

## Obiettivi (INVEST)
1. **Indipendente**: Riutilizza la utility di cache creata nello Sprint 6 per estendere l'ottimizzazione a Calendario e Home, senza impattare la logica del database.
2. **Negoziabile**: I TTL specifici per il calendario e la home possono essere diversi (es. il calendario può avere un TTL più lungo durante i giorni senza gare).
3. **Di Valore (Valuable)**: Rende l'intera esperienza di navigazione nell'app istantanea ed elimina il flash dei loader quando ci si sposta da una sezione all'altra.
4. **Stimabile**: Basato interamente sul refactoring di due componenti React esistenti con codice cache consolidato.
5. **Piccolo (Small)**: Coinvolge l'integrazione di codice di cache esistente su due isole React specifiche.
6. **Testabile**: Verifica dell'assenza di query a Supabase in console all'apertura ripetuta di Calendario e Home.

### Checklist
- [ ] Integrare `fetchWithCache` in [CalendarioIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/CalendarioIsland.tsx) per la query alla tabella `matches`.
- [ ] Integrare `fetchWithCache` in [HomeIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/HomeIsland.tsx) per le chiamate a `mvp_candidates`, `teams` e `players`.
- [ ] Assicurarsi che i dati in background aggiornino lo stato React solo se ci sono discrepanze, riducendo i re-render non necessari.

## Specifiche Tecniche
- Chiavi di cache consigliate: `cage-matches`, `cage-mvp-candidates`, `cage-teams-all`, `cage-players-all`.
- Attenzione: l'integrazione con la cache non deve interferire con le iscrizioni ai canali realtime in `HomeIsland.tsx`. La cache deve servire per lo stato iniziale di caricamento immediato; gli eventi realtime continueranno ad aggiornare lo stato corrente se rilevano modifiche.
