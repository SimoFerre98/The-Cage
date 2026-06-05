# Analisi Realtime & Strategia di Aggiornamento - The Cage

Questo documento analizza lo stato corrente del tempo reale sul sito *The Cage*, classifica i dati in base alla necessità di aggiornamento istantaneo e propone la strategia più efficiente per supportare ~50 utenti concorrenti mantenendo alte prestazioni ed evitando sprechi di risorse/messaggi su Supabase.

---

## 1. Stato Attuale delle Sottoscrizioni Realtime

Analizzando il codice sorgente attuale, abbiamo individuato le seguenti sottoscrizioni Supabase Realtime attive:

1. **`CalendarioIsland.tsx`**:
   - **Canale**: `calendario_realtime_matches`
   - **Eventi**: `*` su tabella `matches`.
   - **Comportamento**: Ricarica l'intera lista delle partite dal DB bypassando la cache ogni volta che un match viene inserito, aggiornato o eliminato.

2. **`LiveMatchIsland.tsx`**:
   - **Canale**: `live_match_updates`
   - **Eventi**: `*` su tabella `matches` e `*` su tabella `match_events`.
   - **Comportamento**: Ricarica i dati del match in diretta e la cronologia degli eventi (gol, cartellini, carte giocate) ad ogni modifica.

3. **`HomeIsland.tsx` (Votazione MVP Pubblica)**:
   - **Canale**: `public_mvp_updates`
   - **Eventi**: `INSERT`, `DELETE`, `UPDATE` su `mvp_votes` e `*` su `mvp_candidates`.
   - **Comportamento**: Aggiorna lo stato dei voti in modo reattivo lato client (incrementando/decrementando il contatore locale) per massima fluidità, con fallback di fetch completa in casi particolari.

4. **`MVPManager.tsx` (Gestione MVP Admin)**:
   - **Canale**: `admin_mvp_updates`
   - **Eventi**: `INSERT`, `DELETE`, `UPDATE` su `mvp_votes` e `*` su `mvp_candidates`.
   - **Comportamento**: Simile al frontend pubblico, aggiorna i conteggi dei voti in tempo reale nella dashboard dell'amministratore.

---

## 2. Classificazione dei Dati: Realtime vs. Cache/Refresh

Per garantire che il sito rimanga efficiente e scalabile per ~50 utenti simultanei (e oltre), dobbiamo classificare i dati dell'applicazione in tre categorie distinte:

### A. Dati Critici (Realtime Istantaneo)
*Dati che devono cambiare immediatamente per tutti gli utenti connessi senza alcuna interazione.*

*   **Punteggio del Match Live (`matches.home_score`, `matches.away_score`)**: Quando l'admin aggiorna il punteggio, tutti gli utenti sulla pagina live (o nel calendario) devono vedere il goal istantaneamente.
*   **Stato del Match (`matches.status`)**: Il passaggio di stato da `PROSSIMA` a `LIVE` (inizio partita) e da `LIVE` a `TERMINATA` (fine partita).
*   **Eventi del Match (`match_events`)**: Gol, Ammonizioni, Espulsioni e attivazione di Power Card. Devono apparire istantaneamente nella timeline live.
*   **Voti MVP (`mvp_votes` e `mvp_candidates`)**: Durante la finestra di voto live a fine torneo, i voti devono aggiornarsi dinamicamente per mostrare le percentuali in tempo reale.

### B. Dati Semi-Critici (Realtime Indiretto o Event-Driven)
*Dati calcolati o derivati che cambiano solo in conseguenza di un evento critico. Non richiedono un polling continuo o canali realtime dedicati, ma devono aggiornarsi non appena l'evento scatenante si conclude.*

*   **Classifica Generale (`standings` - Vista Postgres)**: Cambia solo quando una partita termina (`status` passa a `TERMINATA`) o se viene modificato il risultato di una partita terminata.
*   **Classifica Marcatori (`top_scorers` - Vista Postgres)**: Cambia solo quando viene inserito o rimosso un evento `GOAL` in `match_events`.
*   **Nota Tecnica**: Le viste Postgres non supportano le sottoscrizioni realtime dirette su Supabase. L'aggiornamento in tempo reale di questi dati deve essere guidato dall'ascolto dei cambi sulle tabelle fisiche sottostanti (`matches` e `match_events`).

### C. Dati Statici (Refresh Manuale o SWR Cache a lungo termine)
*Dati che cambiano molto raramente e per i quali il realtime è inefficiente o superfluo.*

*   **Lista delle Squadre e dei Giocatori (`teams`, `players`)**: Vengono modificati solo all'inizio del torneo o in rari casi amministrativi. Possono essere memorizzati nella cache locale (SWR) con durata elevata (es. 15-30 minuti) o invalidati solo manualmente.
*   **Regolamento / Schede delle Carte (`CarteIsland.tsx`)**: Dati interamente statici cablati nel frontend. Non richiedono alcuna interazione con il database.

---

## 3. Strategia di Efficienza per ~50 Utenti Concorrenti

Supabase Realtime (piano gratuito) offre un limite di **200 connessioni concorrenti** e **2.000.000 di messaggi al mese**. Con ~50 utenti attivi, se il sistema è mal progettato, il consumo di messaggi può salire rapidamente. 

Esempio di inefficienza: se 50 utenti hanno 3 tab aperti o se ogni componente crea un canale autonomo che ascolta eventi generici, il server invierà decine di migliaia di messaggi inutili.

Proponiamo le seguenti ottimizzazioni architetturali:

1. **Multiplexing del WebSocket (Supabase Client Unico)**:
   Utilizzare un'unica istanza globale del client Supabase (definita in `src/lib/supabase.ts`). Supabase JS gestisce automaticamente tutte le sottoscrizioni dei componenti sopra un **singolo socket WebSocket** per tab, riducendo drasticamente il numero di connessioni attive sul server.

2. **Filtri Realtime Lato Server (Server-side Row Filtering)**:
   Invece di ascoltare tutti i cambi di `match_events` globali per poi scartarli lato client, utilizzeremo i filtri nativi di Supabase Realtime.
   *Esempio per la pagina Live*: Sottoscrivere solo agli eventi del match attualmente in diretta:
   ```typescript
   supabase.channel('live_events')
     .on('postgres_changes', { 
       event: '*', 
       schema: 'public', 
       table: 'match_events', 
       filter: `match_id=eq.${activeMatchId}` 
     }, (payload) => { ... })
   ```

3. **Integrazione Cache SWR (Stale-While-Revalidate)**:
   Quando si riceve un evento realtime:
   - Aggiornare i dati nello stato React del componente.
   - **Aggiornare la cache in `localStorage`** tramite l'utility `src/lib/cache.ts`.
   In questo modo, se l'utente naviga tra le pagine del sito (grazie ad Astro Transitions), i dati visualizzati saranno immediatamente quelli freschi già memorizzati nella cache locale, senza dover effettuare nuove query al database sul mount del componente.

4. **Event-Driven Cache Invalidation per la Classifica**:
   Attualmente la classifica è cached per 5 minuti. Aggiungeremo una sottoscrizione realtime leggera che ascolta solo:
   - Modifiche su `matches` dove `status` diventa `TERMINATA` o dove il punteggio cambia per una partita terminata.
   - Modifiche su `match_events` di tipo `GOAL`.
   Solo quando si verificano questi eventi specifici, `ClassificaIsland` invaliderà la propria cache ed effettuerà un re-fetch mirato. Negli altri casi, utilizzerà interamente la cache SWR senza toccare il DB.
