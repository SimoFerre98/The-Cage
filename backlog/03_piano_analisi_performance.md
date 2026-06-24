# Piano di Analisi delle Performance

Questo documento descrive i passaggi e le aree di indagine per analizzare le prestazioni dell'applicazione (Astro, React, Supabase, Postgres) al fine di individuare colli di bottiglia e definire proposte di ottimizzazione nel backlog.

---

## Aree di Analisi e Step Operativi

### Step 1: Analisi del Caricamento e dell'Hydration (Astro Front-end)
Astro nasce come framework statico, ma consente l'uso di componenti React dinamici ("isole"). Dobbiamo verificare come queste isole vengono caricate:
1. **Analisi delle direttive `client:*`**: Controllare dove stiamo usando `client:load` rispetto a `client:visible` o `client:idle` (ad esempio in `live.astro`, `classifica.astro`, `calendario.astro`).
2. **Splitting dei Componenti**: Verificare se le isole React (es. `LiveMatchIsland.tsx`, `CalendarioIsland.tsx`) contengono parti puramente statiche (come le intestazioni, i badge descrittivi, ecc.) che potrebbero essere migrate in componenti Astro statici, riducendo la dimensione del codice JavaScript inviato al browser.

### Step 2: React State & Evitare Re-render Inutili
Componenti di grandi dimensioni come `LiveController.tsx` e `LiveMatchIsland.tsx` gestiscono molti stati locali e connessioni in tempo reale (realtime channel).
1. **Memoizzazione**: Verificare l'uso corretto di `useMemo` e `useCallback` su calcoli costosi (es. aggregazione statistiche marcatori/autogol live, filtri di liste) e funzioni passate a componenti figli per evitare re-render non necessari ad ogni broadcast del timer o degli eventi.
2. **Disaccoppiamento del Timer**: Il tempo che scorre ogni secondo (se gestito localmente in React) può scatenare il re-render dell'intero componente. Esaminare se la visualizzazione del tempo residuo è isolata o se influisce sul resto dell'albero dei componenti.

### Step 3: Ottimizzazione Database e Query (Supabase / Postgres)
Il database è il principale punto di contatto per il recupero dati in tempo reale e per il calcolo delle classifiche.
1. **Verifica degli Indici (Missing Indexes)**:
   - Controllare se le chiavi esterne cruciali possiedono indici B-Tree (`match_events.match_id`, `match_events.player_id`, `players.team_id`, `mvp_votes.match_id`, `mvp_votes.player_id`).
   - L'assenza di indici su queste colonne rallenta le query di join e le viste aggregate ad ogni caricamento pagina.
2. **Analisi delle Viste SQL (`top_scorers`, `standings`, `top_assists`)**:
   - Analizzare le query di generazione delle viste per capire se sono ottimali o se possono essere velocizzate tramite indici parziali o riscritture.
3. **Controllo RLS (Row Level Security)**:
   - Verificare che le policy RLS attive sulle tabelle non introducano overhead prestazionale (es. subquery non indicizzate).
4. **Pattern N+1 e Efficienza delle Query**:
   - Assicurarsi che nel recupero dei dati non vengano effettuate chiamate a cascata (es. leggere tutte le partite e poi, in un ciclo, lanciare una query per ciascuna partita per caricarne gli eventi).

### Step 4: Asset, PWA e Caching del browser
1. **Formato e Compressione Immagini**:
   - I loghi delle squadre (`/public/Logos/`) e gli sfondi sono in formato `.png`/`.jpeg`. Analizzare la dimensione ed eventualmente proporre la conversione in `.webp` o l'uso di tecniche di compressione.
2. **Strategia del Service Worker (`sw.js`)**:
   - Analizzare la logica di caching per le risorse statiche (JS, CSS, immagini) per assicurarsi che vengano servite dalla cache locale del browser (Cache-First) riducendo a zero il tempo di caricamento di ritorno.
3. **Caricamento Font e Risorse Esterne**:
   - Verificare se i font (es. Google Fonts) o le icone esterne rallentano il First Contentful Paint (FCP) o creano layout shift (CLS).
