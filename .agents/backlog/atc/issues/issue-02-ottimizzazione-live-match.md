# Issue 2: Ottimizzazione Canali e Filtri Realtime per il Live Match

## Descrizione
Attualmente, il componente `LiveMatchIsland.tsx` ascolta genericamente tutti gli eventi delle tabelle `matches` e `match_events` su tutto il database. Se ci sono più partite simultanee o se l'amministratore modifica dati relativi ad altri match, tutti i client connessi alla pagina live ricevono notifiche inutili ed eseguono re-fetch superflue.

L'obiettivo è limitare il traffico dati e le query al DB applicando filtri lato server (row-level filtering) per il match attualmente in diretta.

---

## Requisiti Tecnici
1. **Filtro Realtime Lato Server**:
   - Invece di sottoscrivere a `{ event: '*', schema: 'public', table: 'match_events' }`, applicare un filtro basato sull'ID del match live correntemente visualizzato.
   - Esempio di filtro:
     ```typescript
     supabase.channel(`live_events_${liveMatchId}`)
       .on('postgres_changes', { 
         event: '*', 
         schema: 'public', 
         table: 'match_events',
         filter: `match_id=eq.${liveMatchId}`
       }, () => { ... })
     ```
   - Fare lo stesso per gli aggiornamenti della tabella `matches` filtrando per `id=eq.${liveMatchId}`.

2. **Gestione del Cambiamento di Match Live**:
   - Se il match live in database cambia o viene chiuso (passa a `TERMINATA`), la sottoscrizione precedente deve essere rimossa e ricreata per il nuovo match attivo (se presente).
   - Inserire `liveMatch?.id` nell'array delle dipendenze di `useEffect` per gestire correttamente la ricostruzione del canale in caso di cambio ID.

3. **Integrazione della Cache locale**:
   - Al ricevimento di un aggiornamento del punteggio o di un nuovo evento, aggiornare anche la cache in `localStorage` in modo che se l'utente torna alla home o naviga nel sito, i dati del match live non richiedano un caricamento da zero.

---

## File da Modificare
*   `src/components/LiveMatchIsland.tsx`

---

## Criteri di Accettazione
- [ ] La pagina Live riceve gli eventi (goal, cartellini, ecc.) in tempo reale solo per la partita attualmente visualizzata.
- [ ] Modifiche a partite non in diretta (es. modifiche a partite future o passate da parte dell'admin) non scatenano alcun messaggio WebSocket o re-fetch sulla pagina del Live Match.
- [ ] Uscendo dalla pagina Live (o smontando il componente), tutti i canali specifici del match vengono disconnessi e distrutti correttamente.
