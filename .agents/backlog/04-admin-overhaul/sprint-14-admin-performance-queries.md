# Sprint 14: Ottimizzazione Prestazioni Admin ed Efficienza Query

**Branch:** `sprint-14-admin-performance-queries`

## Obiettivi (INVEST)
1. **Indipendente**: Migliora le performance del pannello di amministrazione e riduce le query asincrone senza impattare le parti pubbliche dell'app.
2. **Negoziabile**: Le specifiche sull'uso di aggiornamenti ottimistici rispetto a ricariche silenti in background possono essere negoziate a seconda della stabilità del network.
3. **Di Valore (Valuable)**: Elimina i caricamenti e flickering continui nel pannello admin quando si naviga tra i tab e quando si eseguono inserimenti/eliminazioni, migliorando l'efficienza complessiva.
4. **Stimabile**: Basato su modifiche al posizionamento degli stati React (state lifting) e alla logica di recupero dati.
5. **Piccolo (Small)**: Modifiche concentrate su `Dashboard.tsx` e sulla modalità di fetching dei manager dell'area admin.
6. **Testabile**: Misurare il numero di chiamate di rete Supabase nei DevTools durante la navigazione tra i tab di amministrazione.

### Checklist
- [ ] **State Lifting (Sollevamento dello Stato)**:
  - Spostare gli stati comuni di squadre (`teams`), giocatori (`players`) e partite (`matches`) a livello del componente padre [Dashboard.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/admin/Dashboard.tsx).
  - Condividere questi stati e le funzioni di aggiornamento come props ai componenti figli (`TeamsPlayersManager`, `MatchesManager`, `LiveController`, `MVPManager`).
  - Questo eliminerà il caricamento dati ad ogni cambio tab (tempo di transizione ridotto a **0ms** con **0 chiamate al DB**).
- [ ] **Flicker-Free / Caricamenti Silenti**:
  - Rimuovere il blocco di caricamento a schermo intero (`loading = true`) durante l'inserimento o la cancellazione di record (squadre, giocatori, partite, candidati).
  - Eseguire i rinfreschi in background (silent refresh) dopo il completamento con successo di operazioni di scrittura.
- [ ] **Query Relazionali Ottimizzate**:
  - Unificare le query separate per squadre e giocatori in un'unica query join in `Dashboard.tsx` (come già fatto nella Home in Sprint 8).

## Specifiche Tecniche
- La query per squadre e giocatori unificata sarà:
  ```typescript
  const { data } = await supabase.from('teams').select('id, name, players(id, name)').order('name');
  ```
- Passare i dati unificati ai componenti figli, riducendo le query da effettuare ad ogni aggiornamento da 2 a 1.
