# Sprint 11: Lazy Loading Admin e Idratazione Differita

**Branch:** `sprint-11-lazy-loading-hydration`

## Obiettivi (INVEST)
1. **Indipendente**: Migliora le performance di parsing JavaScript globale separatamente dal comportamento funzionale del sito e dalle chiamate API.
2. **Negoziabile**: Le direttive di idratazione (es. `client:visible` vs `client:idle`) possono essere modificate a seconda di quale dà i migliori punteggi Lighthouse di interattività.
3. **Di Valore (Valuable)**: Impedisce agli utenti comuni di scaricare il codice pesante per la dashboard di amministrazione, riducendo le dimensioni dei file JS principali per la maggior parte del traffico.
4. **Stimabile**: Basato su refactoring delle direttive Astro e degli import dinamici di React.
5. **Piccolo (Small)**: Modifiche concentrate su [Layout.astro](file:///c:/Users/s.ferrero/Code/The%20Cage/src/layouts/Layout.astro) e sulle impostazioni di importazione dei moduli.
6. **Testabile**: Misurare il peso dei file JS caricati all'avvio in Home rispetto a quelli caricati in `/admin` usando il tab Network dei DevTools.

### Checklist
- [ ] Rivedere la direttiva `client:load` per i componenti posizionati sotto la piega (es. carte o elenchi marcatori lunghi se caricati separatamente) sostituendola con `client:visible` o `client:idle`.
- [ ] Assicurarsi che le librerie amministrative (come i moduli di gestione partite in `src/components/admin/`) vengano importate in modalità lazy e caricate esclusivamente sulla rotta `/admin`.
- [ ] Abilitare la compressione o minificazione avanzata dei file JavaScript durante il processo di build di produzione.

## Specifiche Tecniche
- In Astro, l'uso di `client:visible` idrata il componente solo quando questo entra nella viewport dell'utente, ottimizzando la memoria e il tempo di CPU al caricamento iniziale.
- Verificare che non vi siano dipendenze incrociate che importino codice dell'area admin all'interno dei componenti pubblici principali.
