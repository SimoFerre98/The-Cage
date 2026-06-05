# Sprint 22: Integrazione Rose (Squadre e Giocatori) in fondo alla Home Page

**Branch:** `sprint-22-rosters-homepage-integration`

## Obiettivi (INVEST)
1. **Indipendente**: La ristrutturazione visiva della Home Page non influisce sulle altre pagine del sito o sulle funzionalità di regia dell'admin.
2. **Negoziabile**: Possiamo personalizzare la quantità di elementi da mostrare in anteprima (es. mostrare solo le prime 3 squadre o estendere).
3. **Di Valore (Valuable)**: Permette all'utente sia di avere una dashboard ad alto impatto grafico (live/countdown match e classifica quick preview) sia di scorrere per consultare le rose e cercare i giocatori in modo semplice.
4. **Stimabile**: Lavoro puramente frontend di riorganizzazione dei layout e dei componenti React.
5. **Piccolo (Small)**: Modifica focalizzata sulla struttura interna di `HomeIsland.tsx`.
6. **Testable**: Caricare la homepage, verificare la presenza dei nuovi widget (dashboard, live match, quick standings) e, scorrendo in basso, confermare il funzionamento dell'accordion delle rose e della lista dei giocatori.

### Checklist
- [ ] Creare una sezione "Esplora il Torneo" nella parte inferiore di [HomeIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/HomeIsland.tsx).
- [ ] Spostare il Pill Toggle ("Squadre" / "Giocatori") e l'accordion delle rose all'interno di questa nuova sezione inferiore.
- [ ] Rimuovere il comportamento `sticky` dal Pill Toggle, in modo che rimanga posizionato staticamente all'inizio della sezione Rose senza coprire i widget superiori durante lo scroll.
- [ ] Implementare un widget di Quick Preview per la classifica (con fetch della vista standings limitata alle prime 3 posizioni) e inserirlo nella parte superiore (Dashboard) della Home Page.
- [ ] Aggiornare il widget Live Match o Prossimo Match nella Dashboard superiore con informazioni dettagliate sull'incontro corrente o futuro.
