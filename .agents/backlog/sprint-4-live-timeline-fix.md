# Sprint 4: Fix Timeline Match Live

**Branch:** `sprint-4-live-timeline-fix`

## Obiettivi
1. Correggere il bug nel caricamento delle immagini delle carte attive sulla timeline live dei match.
2. Sostituire l'accesso a `ev.description` (colonna inesistente nel database `match_events`) con `ev.detail` in `LiveMatchIsland.tsx`.
3. Verificare che l'attivazione in tempo reale delle carte (come Penalty, Shootout, Goal x2, ecc.) mostri le corrette icone, le grafiche di vetro e i bagliori corrispondenti.

## Specifiche Tecniche
- Modificare [LiveMatchIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/LiveMatchIsland.tsx):
  - Rilevare la riga `const detailType = ev.description;` (riga ~255) e sostituirla con `const detailType = ev.detail;`.
  - Controllare che il resto del rendering delle carte (in particolare `renderEventMedia`) utilizzi correttamente `detail` per trovare la corretta immagine `/cards/penalty.webp` ecc.
