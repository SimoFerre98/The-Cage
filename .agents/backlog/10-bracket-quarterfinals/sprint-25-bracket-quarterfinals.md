# Sprint 25: Integrazione Quarti di Finale nel Tabellone

**Branch:** `sprint-25-bracket-quarterfinals`

## Obiettivi (INVEST)
1. **Indipendente**: Aggiungere i quarti di finale non tocca la visualizzazione lineare delle partite nel Calendario principale.
2. **Negoziabile**: Il layout può prevedere un orientamento verticale (Quarti -> Semifinali -> Finale) per adattarsi a display mobile.
3. **Di Valore (Valuable)**: Mostra l'intera fase a eliminazione diretta del torneo in modo completo anziché partire direttamente dalle semifinali.
4. **Stimabile**: Sfrutta lo stesso design di schede e vettori SVG usati per le semifinali/finali, estendendo il tracciato dei nodi.
5. **Piccolo (Small)**: Modifica focalizzata sulla sezione tabellone in `CalendarioIsland.tsx` e relative classi di layout.
6. **Testable**: Caricare il tabellone ed effettuare uno zoom/scroll verificando che tutti i 4 quarti di finale siano visibili, posizionati correttamente e connessi graficamente alle semifinali.

### Checklist
- [ ] Riprogettare il layout del tabellone in [CalendarioIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/CalendarioIsland.tsx) per includere i Quarti di Finale (4 accoppiamenti).
- [ ] Selezionare le squadre qualificate per i quarti e agganciarle ai dati provenienti da Supabase (se disponibili) o definire placeholder testuali nel frontend.
- [ ] Aggiornare i tracciati SVG dei raccordi (`bracket-svg`) per disegnare le connessioni:
  - Quarto 1 e Quarto 2 confluiscono in Semifinale 1.
  - Quarto 3 e Quarto 4 confluiscono in Semifinale 2.
- [ ] Ottimizzare il CSS in [global.css](file:///c:/Users/s.ferrero/Code/The%20Cage/src/styles/global.css) per rendere il tabellone a 3 livelli reattivo e leggibile sui dispositivi mobili (utilizzando layout a scorrimento orizzontale o visualizzazione a cascata).
