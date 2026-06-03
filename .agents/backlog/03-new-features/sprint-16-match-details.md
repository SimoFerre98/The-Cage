# Sprint 16: Dettaglio Partite nel Calendario (Tabellino Eventi)

**Branch:** `sprint-16-match-details`

## Obiettivi (INVEST)
1. **Indipendente**: Funzionalità client-side e di query eventi isolata, senza impatti sulla classifica o sulla gestione live corrente.
2. **Negoziabile**: L'interfaccia può essere un modale o una sezione espandibile direttamente sotto il match.
3. **Di Valore (Valuable)**: Permette agli utenti di sapere chi ha segnato e cosa è successo nei match passati direttamente dal Calendario, aggiungendo grande profondità all'applicazione.
4. **Stimabile**: Basato su una query Supabase (`match_events` filtrati per `match_id`) e un layout modale in React.
5. **Piccolo (Small)**: Modifiche concentrate su `CalendarioIsland.tsx`.
6. **Testabile**: Cliccare su un match concluso e verificare che l'elenco dei marcatori e sanzioni sia caricato e mostrato correttamente.

### Checklist
- [ ] Rivedere il componente [CalendarioIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/CalendarioIsland.tsx):
  - Rendere le schede delle partite cliccabili (se lo stato è `TERMINATA` o `LIVE`).
  - Creare uno stato per memorizzare il match selezionato e l'elenco dei relativi eventi caricati dal database.
- [ ] Creare una funzione `loadMatchEvents(matchId)` per prelevare gli eventi relativi a quella specifica partita (gol, sanzioni, carte giocate) con ordinamento temporale (minuto).
- [ ] Creare un modale glassmorphic animato per mostrare il tabellino della partita:
  - Nomi dei marcatori ordinati per minuto (con icona pallone `⚽`).
  - Ammonizioni ed espulsioni (con cartellini colorati).
  - Carte speciali attivate dalle squadre (con grafica miniatura).
