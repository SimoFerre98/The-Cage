# Sprint 8: Ottimizzazione Query Relazionali (Teams & Players)

**Branch:** `sprint-8-teams-players-query`

## Obiettivi (INVEST)
1. **Indipendente**: Migliora l'efficienza della query iniziale in Home, separabile rispetto alla logica di caching generale e alla logica di voto MVP.
2. **Negoziabile**: I campi selezionati nella query nidificata possono essere estesi se servono altri dettagli sui giocatori o sulle squadre in futuro.
3. **Di Valore (Valuable)**: Dimezza il numero di richieste HTTP simultanee all'avvio dell'app per raccogliere le informazioni sull'organico delle squadre.
4. **Stimabile**: Lavoro focalizzato sul database client di Supabase e sulla mappatura dei dati.
5. **Piccolo (Small)**: Circoscritto a una singola query in `HomeIsland.tsx` e all'adeguamento dei cicli di elaborazione.
6. **Testabile**: Verificare che l'elenco delle squadre e dei rispettivi giocatori continui ad apparire correttamente e che venga eseguito un solo HTTP call invece di due.

### Checklist
- [ ] Rimuovere le due chiamate separate `.from('teams')` e `.from('players')` in [HomeIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/HomeIsland.tsx).
- [ ] Scrivere un'unica query relazionale Supabase per estrarre le squadre comprensive dei rispettivi giocatori associati:
  ```typescript
  const { data } = await supabase
    .from('teams')
    .select('id, name, players(id, name)')
    .order('name');
  ```
- [ ] Adattare la logica interna del componente `HomeIsland` per mappare questo nuovo formato dati nidificato direttamente nello stato locale (`teams` e `playersAll`).

## Specifiche Tecniche
- Sfruttare le foreign key del database per consentire a Supabase di eseguire il JOIN automatico tra `teams` e `players` sul campo `team_id`.
- Assicurarsi che l'ordine alfabetico dei giocatori all'interno di ciascuna squadra sia preservato o gestito via JavaScript / ordinamento SQL.
