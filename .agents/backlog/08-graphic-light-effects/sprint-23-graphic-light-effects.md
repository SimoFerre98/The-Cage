# Sprint 23: Effetti Grafici e Luci (Liquid Glass Glow System)

**Branch:** `sprint-23-graphic-light-effects`

## Obiettivi (INVEST)
1. **Indipendente**: Modifiche focalizzate sul design CSS e micro-interazioni senza impattare sulla logica applicativa del DB.
2. **Negoziabile**: Possiamo abilitare gli effetti avanzati (come il tracciamento del mouse) solo su schermi desktop per preservare le prestazioni mobile.
3. **Di Valore (Valuable)**: Offre un impatto estetico "Wow" ed estremamente premium al portale, migliorando significativamente l'esperienza utente.
4. **Stimabile**: Sfrutta le moderne caratteristiche dei CSS moderni (custom variables, blur filters, CSS grids) e React state.
5. **Piccolo (Small)**: Circoscritto al file di stile globale e all'aggiunta di un componente wrapper o hook per l'effetto rifrazione.
6. **Testable**: Ispezione visiva del portale per confermare la fluidità degli effetti di luce hover e le animazioni dei blob di sfondo.

### Checklist
- [x] Creare un wrapper React `SpotlightCard.tsx` o hook per tracciare il movimento del cursore del mouse e passare le coordinate `--mouse-x` e `--mouse-y` all'elemento. (Implementato direttamente in GlassEffect.tsx per tutti i card)
- [x] Definire in [global.css](file:///c:/Users/s.ferrero/Code/The%20Cage/src/styles/global.css) gli stili per l'effetto spotlight con gradienti radiali.
- [x] Aggiungere bordi luminosi al passaggio del mouse su tutte le schede principali (`glass-card` / `GlassEffect`).
- [x] Aggiungere ed animare i blob di sfondo (`bg-blobs`) per simulare un'atmosfera liquida e tridimensionale.
- [x] Applicare effetti di testo neon e pulsazioni soffuse per la partita live e la finale del tabellone.
