Agisci come un Esperto Frontend Developer specializzato in UI/UX Motion Design moderni. Devo ottimizzare e rifare il look alla UI/UX del sito web di un torneo di calcio. Il sito sarà visitato al 90% da smartphone, quindi l'intera struttura deve essere strettamente Mobile-First, altamente usabile con il pollice (thumb-zone ottimizzata) e reattiva.

Voglio che il design adotti uno stile premium e futuristico, ispirato fortemente all'effetto Liquid Glass e alle trasparenze dinamiche di Apple (Glassmorphism evoluto).

Applica le seguenti linee guida strutturali e visive:

1. STILE VISIVO & LIQUID GLASS:

- Usa un background scuro e profondo (es. dark mode dinamica con sfumature fluide/neon sullo sfondo che si muovono lentamente).
- Per le card (classifiche, match, statistiche) usa un effetto Glassmorphism avanzato: background con opacità ridotta, un forte `backdrop-filter: blur(20px)`, bordi finissimi e semi-trasparenti che simulano il riflesso del vetro, e un leggero bagliore interno (inner shadow).
- Integra elementi grafici con forme organiche e "liquide" (smooth blobs) che fluttuano sullo sfondo per dare profondità alle trasparenze delle card in primo piano.

2. ANIMAZIONI FLUIDE (Focalizzate sulle Performance):

- Ogni transizione di stato (cambio tab, apertura dettagli partita, espansione delle statistiche) deve essere burrosa e fluida.
- Usa curve di easing naturali ispirate ad Apple (es. cubic-bezier(0.25, 1, 0.5, 1) o spring physics).
- Implementa micro-interazioni sui tap: leggero shrink al touch, hover/active states fluidi, ed effetti di "shimmer" (riflesso di luce) che passano sulle card di vetro quando appaiono a schermo.
- Ottimizza le animazioni usando solo proprietà che non causano repaint pesanti (usa `transform` e `opacity`) per garantire i 60fps fissi anche su smartphone meno recenti.

3. STRUTTURA MOBILE-FIRST (Torneo di Calcio):

- I componenti principali da stilizzare sono: una Dashboard con i match del giorno/live, la Tabella Classifica e i Tab di navigazione inferiori (Bottom Navigation Bar stile App nativa).
- La navigazione tra i tab deve includere un indicatore liquido o una pillola di sfondo che si sposta in modo fluido da un'icona all'altra al cambio sezione.
- Per le liste lunghe (es. marcatori o partite), implementa un caricamento ad apparizione fluida (fade-in + slide-up) mentre l'utente scrolla.

Forniscimi il codice HTML/CSS (o componenti React/Tailwind se preferisci, specifica quale) per la struttura principale e le classi/stili necessari per ottenere questo effetto Liquid Glass super animato e fluido.
