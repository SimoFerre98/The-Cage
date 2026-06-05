# Sprint 20: Rimozione conteggio giocatori nel drop down delle squadre

**Branch:** `sprint-20-remove-player-numbers`

## Obiettivi (INVEST)
1. **Indipendente**: Rimozione del testo di conteggio giocatori indipendente da altre logiche di dati.
2. **Negoziabile**: Possiamo rimuoverlo solo sul frontend pubblico lasciandolo in admin per utilità.
3. **Di Valore (Valuable)**: Rende l'interfaccia meno densa di informazioni non essenziali.
4. **Stimabile**: Modifica semplice di poche righe in React.
5. **Piccolo (Small)**: Modifica limitata a un singolo file.
6. **Testable**: Verifica visiva dell'assenza della label "X giocatori" sotto il nome del team sulla homepage.

### Checklist
- [x] Rimuovere la label `{team.players.length} giocatori` sotto il nome del team in [HomeIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/HomeIsland.tsx).
- [x] Regolare i margini ed il padding del layout per compensare l'altezza ridotta dell'elemento della squadra.
