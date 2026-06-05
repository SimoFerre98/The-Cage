# Sprint 25: Integrazione Quarti di Finale nel Tabellone

**Branch:** `sprint-25-bracket-quarterfinals`

## Obiettivi (INVEST)
1. **Indipendente**: Aggiungere i quarti di finale non tocca la visualizzazione lineare delle partite nel Calendario principale, né impatta la Home Page o l'elenco delle rose.
2. **Negoziabile**: Il layout prevede un orientamento orizzontale a scorrimento (Quarti -> Semifinali -> Finale) per adattarsi a display desktop e mobile.
3. **Di Valore (Valuable)**: Mostra l'intera fase a eliminazione diretta del torneo in modo completo (3 livelli), offrendo una visione d'insieme chiara e professionale.
4. **Stimabile**: Sfrutta lo stesso design di schede e vettori SVG usati per le semifinali/finali, estendendo il tracciato dei nodi e le query relative.
5. **Piccolo (Small)**: Modifica focalizzata esclusivamente sulla scheda "Tabellone" in `CalendarioIsland.tsx` e relativi stili in `global.css`.
6. **Testable**: Caricare il tabellone ed effettuare uno zoom/scroll verificando che tutti i 4 quarti di finale siano visibili, posizionati correttamente e connessi graficamente alle semifinali.

### Checklist
- [ ] Implementare la funzione helper `findMatchByRound` in `CalendarioIsland.tsx` per mappare i match della fase a eliminazione diretta dal DB.
- [ ] Riprogettare il layout del tabellone in [CalendarioIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/CalendarioIsland.tsx) per includere i Quarti di Finale (4 accoppiamenti: QF1, QF2, QF3, QF4).
- [ ] Agganciare i dati reali provenienti da Supabase (nomi squadre, punteggi, date, stato LIVE) o definire placeholder testuali descrittivi nel frontend in caso di dati assenti.
- [ ] Disegnare i tracciati SVG dei raccordi per connettere graficamente i Quarti di Finale alle Semifinali:
  - Quarto 1 (X=12.5%) e Quarto 2 (X=37.5%) confluiscono in Semifinale 1 (X=25%).
  - Quarto 3 (X=62.5%) e Quarto 4 (X=87.5%) confluiscono in Semifinale 2 (X=75%).
- [ ] Ottimizzare il layout CSS in [global.css](file:///c:/Users/s.ferrero/Code/The%20Cage/src/styles/global.css) introducendo un contenitore scrollabile orizzontalmente (`.bracket-scroll-wrapper`) per mantenere la leggibilità sui dispositivi mobili.
