# Sprint 26: Fase Finale Autogestita

**Branch:** `sprint-26-fase-finale`

## Obiettivi (INVEST)
1. **Indipendente**: Le modifiche alla fase finale non influiscono sui match passati della fase a gironi, ma automatizzano il calcolo e la visualizzazione del tabellone.
2. **Negoziabile**: L'accoppiamento delle semifinali segue lo schema dello screenshot: Partita 1 (QF1) vs Partita 3 (QF3) e Partita 2 (QF2) vs Partita 4 (QF4). Il passaggio dei vincitori è delegato a un trigger Postgres.
3. **Di Valore (Valuable)**: Permette agli organizzatori di gestire la serata delle finali senza dover inserire manualmente le squadre nelle partite successive sul database, eliminando il rischio di errori sotto pressione.
4. **Stimabile**: I compiti sono chiaramente divisi tra modifiche CSS, seeding SQL e un trigger del database Postgres.
5. **Piccolo (Small)**: Intervento mirato su `CalendarioIsland.tsx`, `global.css`, lo schema delle tabelle di Supabase e una nuova migrazione SQL.
6. **Testabile**: Simulando il completamento dei quarti (es: impostando uno score e marcando come TERMINATA), i vincitori devono apparire istantaneamente nelle semifinali corrispondenti sul tabellone pubblico.

---

## Issue Tracciate nel Backlog

### Issue 1: Layout Responsivo del Tabellone su Smartphone (CSS & Componente)
- **Descrizione**: Attualmente su dispositivi mobili il tabellone viene compresso in una lista verticale e le linee di connessione SVG vengono nascoste (`display: none`). Vogliamo ripristinare il grafico delle fasi con scorrimento orizzontale anche su smartphone, mantenendo lo stesso feeling visivo della versione desktop.
- **Attività**:
  - Rimuovere o sovrascrivere le regole CSS in `global.css` che forzano la direzione verticale (`flex-direction: column`) su `.bracket-row` per schermi <= 768px.
  - Mantenere visibile il contenitore dei connettori SVG (`.bracket-connector-container`) ed assicurarsi che le linee si posizionino correttamente.
  - Abilitare lo scorrimento orizzontale su `.bracket-scroll-wrapper` usando `overflow-x: auto` e mantenendo una larghezza minima del tabellone (es: `min-width: 960px` o simile) in modo da consentire lo swipe orizzontale fluido.

### Issue 2: Aggiornamento Schema Database (Colonne Nullable) e Seeding Partite del Venerdì
- **Descrizione**: Dobbiamo inserire i quarti di finale con le squadre reali e gli orari corretti. Inoltre, per consentire al tabellone e al calendario di mostrare le semifinali e la finale in anticipo (anche senza le squadre ancora decise), dobbiamo rendere nulle le colonne `home_team_id` e `away_team_id` nella tabella `matches`.
- **Attività**:
  - Creare una migrazione SQL che rimuova il vincolo `NOT NULL` da `home_team_id` e `away_team_id` nella tabella `public.matches`.
  - Inserire le 4 partite dei Quarti di Finale per venerdì 26 giugno 2026:
    - **QF1 (Quarti 1)**: Sezione 164 vs San Teodoro Ketzmaja (19:30)
    - **QF2 (Quarti 2)**: Taverna FC vs FC Pontos (20:00)
    - **QF3 (Quarti 3)**: UCG vs Gli Umili (20:30)
    - **QF4 (Quarti 4)**: Gilly Boys vs Chainz (21:00)
  - Inserire le partite delle Semifinali e della Finale come segnaposto con team a `NULL`:
    - **SF1 (Semifinale 1)**: (Vincitore QF1 vs Vincitore QF3) alle 21:45
    - **SF2 (Semifinale 2)**: (Vincitore QF2 vs Vincitore QF4) alle 22:15
    - **Finale**: (Vincitore SF1 vs Vincitore SF2) alle 23:00

### Issue 3: Allineamento Etichette e Flusso Semifinali nel Frontend
- **Descrizione**: L'attuale configurazione nel frontend associa la Semifinale 1 a (QF1 vs QF2) e la Semifinale 2 a (QF3 vs QF4). Dobbiamo aggiornare la UI per rispecchiare lo schema ufficiale dello screenshot (QF1 vs QF3 e QF2 vs QF4) e aggiornare le etichette segnaposto (es. "Vincitrice Partita 1").
- **Attività**:
  - In `CalendarioIsland.tsx`, aggiornare la funzione `renderBracketCard` per le semifinali:
    - Semifinale 1: segnaposto `"Vincitrice Partita 1"` e `"Vincitrice Partita 3"`, orario `"26 giu, 21:45"`.
    - Semifinale 2: segnaposto `"Vincitrice Partita 2"` e `"Vincitrice Partita 4"`, orario `"26 giu, 22:15"`.
    - Finale: segnaposto `"Vincitrice Semifinale 1"` e `"Vincitrice Semifinale 2"`, orario `"26 giu, 23:00"`.
  - Aggiornare i link/visualizzazioni nel tabellone in modo che le linee di raccordo SVG puntino coerentemente alle giuste posizioni.

### Issue 4: Logica di Passaggio Turno Automatico (PostgreSQL Trigger)
- **Descrizione**: Vogliamo che il passaggio del turno avvenga in modo del tutto automatico sul database. Appena un match di tipo QF o SF viene marcato come `TERMINATA`, il database deve calcolare il vincitore ed inserirlo nella slot corretta del turno successivo.
- **Attività**:
  - Scrivere una funzione Postgres `fn_advance_bracket_winner()` attivata da un trigger `AFTER UPDATE ON public.matches`.
  - La logica deve:
    - Eseguirsi solo se lo `status` passa a `'TERMINATA'` e i punteggi non sono pari (in caso di parità, attendere la risoluzione ai rigori/shootout registrata con punteggio sbilanciato).
    - Individuare la squadra vincente: `CASE WHEN home_score > away_score THEN home_team_id ELSE away_team_id END`.
    - Identificare la partita successiva in base al round terminato:
      - Se termina `QF1` -> Aggiorna `home_team_id` del match `SF1`.
      - Se termina `QF3` -> Aggiorna `away_team_id` del match `SF1`.
      - Se termina `QF2` -> Aggiorna `home_team_id` del match `SF2`.
      - Se termina `QF4` -> Aggiorna `away_team_id` del match `SF2`.
      - Se termina `SF1` -> Aggiorna `home_team_id` del match `Finale`.
      - Se termina `SF2` -> Aggiorna `away_team_id` del match `Finale`.

### Issue 5: Isolamento Classifica Fase a Gironi (Standings View Filter)
- **Descrizione**: Attualmente la vista `public.standings` aggrega tutti i match terminati nel database. Questo causa un bug grave: le vittorie e i gol della fase finale verrebbero conteggiati nella classifica del girone unico. Dobbiamo isolare la classifica in modo che conteggi solo i match del girone.
- **Attività**:
  - Modificare la vista `public.standings` aggiungendo la condizione `m.round = 'Fase a Gironi'` nella join delle partite terminate.
  - Lasciare inalterate le statistiche individuali (`top_scorers`, `top_assists`, `top_cards`), poiché i gol e i cartellini della fase finale devono essere conteggiati normalmente nella classifica marcatori/sanzioni complessiva del torneo.
