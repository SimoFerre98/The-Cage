# Sprint 17: Indicatore Live e Notifiche Broadcast in App

**Branch:** `sprint-17-live-broadcast-indicator`

## Obiettivi (INVEST)
1. **Indipendente**: Migliora l'engagement e le notifiche in-app senza alterare la logica delle partite stesse.
2. **Negoziabile**: Le notifiche in-app possono essere toast a comparsa o banner statici nella testata.
3. **Di Valore (Valuable)**: Avvisa gli utenti sulla presenza di partite in corso da qualsiasi pagina dell'app, spingendoli a visualizzare la diretta live in tempo reale.
4. **Stimabile**: Basato su sottoscrizione realtime globale alla tabella `matches` e componenti React per i toast.
5. **Piccolo (Small)**: Coinvolge la barra di navigazione/topbar ed un gestore di notifiche temporanee in `Layout.astro`.
6. **Testabile**: Modificare lo stato di una partita in LIVE dall'admin e confermare che compaia il badge rosso lampeggiante "Diretta in corso" nella Home ed una notifica toast.

### Checklist
- [ ] Creare un indicatore visivo "🔴 LIVE" galleggiante o integrato nella topbar di [Layout.astro](file:///c:/Users/s.ferrero/Code/The%20Cage/src/layouts/Layout.astro) / [LiquidNav.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/LiquidNav.tsx).
- [ ] Configurare una sottoscrizione in tempo reale globale che controlli se esiste almeno una riga in `matches` con `status = 'LIVE'`.
- [ ] Se una partita entra in stato `LIVE` mentre l'utente naviga il sito:
  - Mostrare un banner toast animato: "Partita in Diretta! Clicca qui per guardare".
- [ ] Se un gol viene segnato nella partita in corso:
  - Ricevere l'evento broadcast di tipo `GOAL` e mostrare una notifica toast con micro-animazione in tempo reale su qualsiasi pagina l'utente si trovi (es. "GOAL! Squadra A - Squadra B 1-0 (Minuto 14)").
