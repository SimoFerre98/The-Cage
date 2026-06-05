# Sprint 22: Tab "Rose" (Squadre e Giocatori) in Classifica

**Branch:** `sprint-22-rosters-tab-classifica`

## Obiettivi (INVEST)
1. **Indipendente**: Lo spostamento delle liste non impatta sul caricamento o aggiornamento della classifica dei punti o dei marcatori.
2. **Negoziabile**: Possiamo riorganizzare i componenti per condividere le medesime query di fetching esistenti.
3. **Di Valore (Valuable)**: Libera spazio sulla Homepage consentendone un design più leggero e moderno, e raggruppa logicamente le informazioni di squadre e giocatori sotto "Classifica".
4. **Stimabile**: Lavoro frontend di spostamento e integrazione di componenti React.
5. **Piccolo (Small)**: Coinvolge principalmente due file: `HomeIsland.tsx` e `ClassificaIsland.tsx`.
6. **Testable**: Accedere a `/classifica`, cliccare sul tab "Rose" e verificare che la lista delle squadre sia visibile ed espandibile.

### Checklist
- [ ] Rimuovere il codice HTML/React delle liste squadre e giocatori e il pill toggle da [HomeIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/HomeIsland.tsx).
- [ ] Aggiornare [ClassificaIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/ClassificaIsland.tsx) per introdurre una terza opzione di tab ("Rose") all'interno della barra dei controlli.
- [ ] Portare la logica di fetching di `cage-teams-with-players` e l'accordion in [ClassificaIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/ClassificaIsland.tsx) all'interno del nuovo tab "Rose".
- [ ] Assicurarsi che la ricerca e il caricamento siano ottimizzati e non rallentino il caricamento dei punti e dei marcatori.
