# Issue 1: Implementazione Realtime per Classifica e Marcatori

## Descrizione
Attualmente, la classifica delle squadre (`standings`) e dei marcatori (`top_scorers`) nella pagina Classifica (`ClassificaIsland.tsx`) utilizza una cache SWR (`fetchWithCache`) con una durata (TTL) di 5 minuti. Se l'amministratore inserisce o modifica un risultato durante il torneo, gli utenti non vedono la classifica aggiornata a meno che non eseguano un ricaricamento manuale della pagina o scada la cache.

L'obiettivo è rendere l'aggiornamento della classifica istantaneo per tutti gli utenti connessi quando si verificano eventi rilevanti nel database.

---

## Requisiti Tecnici
1. **Sottoscrizione Realtime in `ClassificaIsland.tsx`**:
   - Creare una sottoscrizione Supabase Realtime all'interno del componente.
   - Ascoltare gli eventi di tipo `*` sulla tabella `matches`.
   - Ascoltare gli eventi di tipo `*` sulla tabella `match_events`.

2. **Filtro degli Eventi (Client-side)**:
   - Aggiornare la classifica solo se:
     - Un match cambia il suo `status` in `'TERMINATA'` (o se un match già `'TERMINATA'` subisce modifiche al punteggio).
     - Viene inserito/eliminato/modificato un evento di tipo `'GOAL'` nella tabella `match_events`.

3. **Invalidazione della Cache**:
   - In caso di evento valido, rimuovere o aggiornare le chiavi di cache `cage-standings` e `cage-top-scorers` dal `localStorage` e da `window.__cage_cache`.
   - Rieseguire il caricamento dei dati (`loadData()`) per aggiornare lo stato React del componente.

4. **Ottimizzazione (Debounce)**:
   - Se vengono aggiornati più punteggi o inseriti più gol contemporaneamente (es. aggiornamento rapido in regia), evitare fetch multiple ravvicinate al database.
   - Implementare un breve debounce (es. 2 secondi) per raggruppare le richieste di ricarica.

---

## File da Modificare
*   `src/components/ClassificaIsland.tsx` (Implementazione sottoscrizione e aggiornamento)

---

## Criteri di Accettazione
- [ ] Aprendo la classifica su un browser e la dashboard admin su un altro, al passaggio di una partita a "TERMINATA" con cambio di punteggio, la classifica dei punti delle squadre si aggiorna istantaneamente sul client senza refresh.
- [ ] All'aggiunta di un gol per un giocatore da parte dell'admin, la classifica dei Marcatori si aggiorna all'istante mostrando il nuovo totale del giocatore.
- [ ] Il canale realtime viene rimosso correttamente all'unmount del componente (`cleanup` di `useEffect`).
- [ ] Non si verificano chiamate duplicate o loop infiniti di fetch quando si ricevono eventi.
