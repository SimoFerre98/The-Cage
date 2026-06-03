# Sprint 10: Ottimizzazione Service Worker (PWA) e Compressione Asset

**Branch:** `sprint-10-pwa-assets-optimization`

## Obiettivi (INVEST)
1. **Indipendente**: Tratta la velocità di scaricamento iniziale degli asset e l'offline del client senza influenzare le funzionalità database e le query Supabase.
2. **Negoziabile**: La scelta del livello di compressione per WebP/AVIF o l'elenco esatto di risorse da pre-caricare può essere decisa in base al peso ideale finale dei file.
3. **Di Valore (Valuable)**: Migliora drasticamente i punteggi Lighthouse, riduce il consumo di rete per telefoni cellulari e velocizza il primo caricamento del sito (FCP).
4. **Stimabile**: Basato su conversione file grafici e configurazione di file JS/Astro di configurazione.
5. **Piccolo (Small)**: Attività orientata agli asset statici (immagini e service worker).
6. **Testabile**: Simulazione di connettività offline ("Offline mode" in Chrome DevTools) e misurazione del tempo di caricamento dello sfondo e loghi.

### Checklist
- [ ] Convertire l'immagine `sfondo.jpg` (330KB) e altri asset grafici pesanti in formato ad alta efficienza **WebP** o **AVIF**, portandoli sotto i 100KB.
- [ ] Implementare strategie di caching in `public/sw.js`:
    - **Cache First** con invalidamento tramite hash per file CSS compilati, loghi, sfondi, e font.
    - **Stale-While-Revalidate** per le rotte e i file HTML principali.
- [ ] Aggiungere i tag `<link rel="preload">` in [Layout.astro](file:///c:/Users/s.ferrero/Code/The%20Cage/src/layouts/Layout.astro) per caricare in priorità lo sfondo e il logo del torneo.
- [ ] Gestire un fallback offline pulito (pagina statica `offline.html`) qualora la risorsa richiesta non sia presente in cache e la rete sia assente.

## Specifiche Tecniche
- La compressione delle immagini può essere fatta tramite tool da riga di comando (es. Sharp o ImageMagick) o convertitori locali.
- Verificare che il service worker non blocchi le connessioni websocket/realtime a Supabase (`*.supabase.co/realtime/*`).
