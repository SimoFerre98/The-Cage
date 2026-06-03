# Sprint 18: OpenGraph, Meta Tags SEO e Condivisione Social

**Branch:** `sprint-18-seo-sharing`

## Obiettivi (INVEST)
1. **Indipendente**: Migliora l'indicizzazione ed i metadati di condivisione senza alcuna dipendenza da database o logica applicativa.
2. **Negoziabile**: L'esatta struttura dei testi di condivisione e delle immagini OpenGraph può essere personalizzata.
3. **Di Valore (Valuable)**: Quando gli utenti condividono i link del torneo su WhatsApp, Instagram o Facebook, compare un'anteprima accattivante con logo, descrizione e titolo del Memorial Gerry The Cage.
4. **Stimabile**: Basato su tag HTML standard nell'head di Astro.
5. **Piccolo (Small)**: Modifiche limitate a `Layout.astro` ed alla gestione delle immagini del manifest.
6. **Testabile**: Utilizzare strumenti di anteprima dei social o ispezionare il DOM per verificare la presenza dei meta-tag.

### Checklist
- [ ] Inserire i tag **OpenGraph** standard e tag **Twitter Card** nel blocco head di [Layout.astro](file:///c:/Users/s.ferrero/Code/The%20Cage/src/layouts/Layout.astro) e [LayoutLive.astro](file:///c:/Users/s.ferrero/Code/The%20Cage/src/layouts/LayoutLive.astro):
  - `og:title`, `og:description`, `og:image` (utilizzando il logo del torneo `/Logo_Torneo.webp`), `og:url`.
  - `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.
- [ ] Configurare i titoli dinamici di pagina affinché siano descrittivi ed ottimizzati SEO (es. "Classifica Torneo | Memorial Gerry The Cage").
- [ ] Creare un piccolo pulsante "Condividi Classifica" o "Condividi Risultato" nelle schede di `ClassificaIsland` o `CalendarioIsland` che sfrutti l'API nativa `navigator.share` (Web Share API) su dispositivi mobile, per facilitare l'invio rapido dei risultati su chat e social.
