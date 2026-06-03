# Sprint 15: Admin Testing Suite ed Esperienza Utente (UX)

**Branch:** `sprint-15-admin-ux-testing`

## Obiettivi (INVEST)
1. **Indipendente**: Tratta l'esperienza utente e la stabilità delle operazioni admin senza modificare la struttura del database.
2. **Negoziabile**: Le esatte animazioni dei toast e lo stile dei modali personalizzati possono essere negoziati in base al feedback del design.
3. **Di Valore (Valuable)**: Sostituisce i vecchi dialoghi nativi del browser (`confirm()`, `alert()`) con componenti React custom a tema e assicura che tutte le funzionalità admin funzionino perfettamente grazie a una suite di test.
4. **Stimabile**: Basato su componenti UI di feedback e simulazioni browser.
5. **Piccolo (Small)**: Attività incentrata sui flussi di input-output del pannello amministrativo.
6. **Testabile**: Un test end-to-end con browser subagent che esegua l'intero ciclo amministrativo (creazione squadra, aggiunta giocatore, creazione partita, salvataggio eventi live, reset voti).

### Checklist
- [ ] **Modali e Toast Personalizzati**:
  - Creare un componente di notifica popup/toast per segnalare successi ed errori in modo non invasivo ed animato.
  - Sostituire le chiamate `alert()` e `confirm()` in tutti i file manager amministrativi con un componente modale custom.
- [ ] **Validazione degli Input**:
  - Impedire l'inserimento di nomi vuoti o con soli spazi.
  - Mostrare indicatori di errore grafici (bordi rossi) e messaggi descrittivi.
- [ ] **Testing Suite Completa (Automated Browser Verification)**:
  - Definire uno script di test per il Browser Subagent che verifichi l'intero flusso amministrativo:
    1. Effettuare il login.
    2. Creare una squadra di test ("Test Team") ed un giocatore di test ("Test Player").
    3. Creare un match di test nel calendario.
    4. Navigare sul Regia LIVE e simulare il salvataggio di un evento (gol di "Test Player").
    5. Aggiungere il giocatore ai candidati MVP, votarlo, ed effettuare il reset completo.
    6. Cancellare la squadra ed il match di test per ripulire il database.

## Specifiche Tecniche
- I toast verranno inseriti in uno stato globale del pannello admin (`AdminApp.tsx`) e rimossi automaticamente dopo 3 secondi utilizzando un timer.
- Le transizioni delle notifiche utilizzeranno micro-animazioni CSS (`slideIn` e `fadeOut`).
