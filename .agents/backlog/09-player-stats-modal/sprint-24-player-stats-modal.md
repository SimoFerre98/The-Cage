# Sprint 24: Modale Statistiche Specifiche Giocatore

**Branch:** `sprint-24-player-stats-modal`

## Obiettivi (INVEST)
1. **Indipendente**: Il caricamento delle statistiche del giocatore non influenza altre parti delle pagine.
2. **Negoziabile**: Il modale può essere esteso in futuro con grafici o percentuali di successo, partendo ora con dati numerici storici ed eventi.
3. **Di Valore (Valuable)**: Permette agli utenti di conoscere il rendimento live e storico del singolo atleta in dettaglio (gol, ammonizioni, espulsioni, carte giocate).
4. **Stimabile**: Basato su query aggregate semplici della tabella `match_events`.
5. **Piccolo (Small)**: Sviluppo di un singolo componente modale React e relativo collegamento nei punti in cui compare il nome del giocatore.
6. **Testable**: Cliccare sul nome di un giocatore (es. in classifica marcatori) e verificare che si apra il modale e mostri correttamente i gol e cartellini estratti dal DB.

### Checklist
- [x] Creare il componente [PlayerStatsModal.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/PlayerStatsModal.tsx):
  - Deve caricare dinamicamente le informazioni del giocatore (Nome, Squadra).
  - Deve eseguire query su `match_events` filtrate per `player_id` per contare: Gol, Ammonizioni, Espulsioni, Carte Speciali.
  - Deve recuperare la lista cronologica di tutti gli eventi inseriti durante il live per il giocatore in questione, arricchiti con il round della partita.
- [x] Integrare l'evento click sui nomi dei giocatori nei seguenti componenti:
  - [ClassificaIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/ClassificaIsland.tsx) (tab Marcatori e tab Rose).
  - [HomeIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/HomeIsland.tsx) (tab Giocatori, lista candidati MVP).
  - [LiveMatchIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/LiveMatchIsland.tsx) (nella timeline degli eventi live).
- [x] Applicare design premium Glassmorphic con icone dedicate per ciascuna statistica.
