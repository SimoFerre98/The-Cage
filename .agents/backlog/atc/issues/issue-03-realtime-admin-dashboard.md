# Issue 3: Sincronizzazione Realtime per la Dashboard Admin

## Descrizione
L'interfaccia di amministrazione (`Dashboard.tsx` e i suoi sottomoduli `MatchesManager.tsx`, `TeamsPlayersManager.tsx`, `LiveController.tsx`) gestisce l'inserimento e la modifica dei dati del torneo. Attualmente, se due amministratori sono connessi contemporaneamente, o se vengono effettuate modifiche al database esternamente, la dashboard non mostra le modifiche all'istante, costringendo al refresh manuale.

L'obiettivo è abilitare la sincronizzazione in tempo reale dello stato centrale dell'Admin Dashboard.

---

## Requisiti Tecnici
1. **Sottoscrizioni Centralizzate in `Dashboard.tsx`**:
   - Aggiungere un `useEffect` in `Dashboard.tsx` dedicato all'ascolto dei cambiamenti sul database.
   - Sottoscrivere alle modifiche di:
     - Tabella `teams` (eventi `*`) -> scatena `refreshTeams()`
     - Tabella `players` (eventi `*`) -> scatena `refreshTeams()`
     - Tabella `matches` (eventi `*`) -> scatena `refreshMatches()`

2. **Prevenzione Loop Locali**:
   - Quando un admin esegue un'operazione di scrittura locale (es. aggiunge un match tramite il form), il database notificherà la modifica via realtime.
   - Assicurarsi che le chiamate a `refreshMatches()` o `refreshTeams()` siano gestite correttamente senza conflitti di stato (React gestisce lo stato in modo asincrono, quindi chiamare `refresh` dopo una transazione locale non è un problema, ma è bene verificare che non si creino render multipli superflui).

3. **Feedback Visivo di Sincronizzazione**:
   - Aggiungere un piccolo indicatore visivo nell'header della dashboard (es. vicino al titolo o nel footer) per mostrare lo stato della connessione realtime ("Sincronizzato 🟢" / "Connessione in corso... 🟡").

---

## File da Modificare
*   `src/components/admin/Dashboard.tsx`

---

## Criteri di Accettazione
- [ ] Con due finestre del browser aperte sulla Dashboard di Amministrazione (anche su schede/computer diversi):
  - Creando, modificando o eliminando una squadra o un giocatore in una finestra, la lista nell'altra finestra si aggiorna istantaneamente.
  - Creando o eliminando una partita, il calendario dell'altra finestra si sincronizza all'istante.
- [ ] La disconnessione (logout) o la chiusura della dashboard rimuove correttamente tutti i canali per evitare leak di connessioni.
