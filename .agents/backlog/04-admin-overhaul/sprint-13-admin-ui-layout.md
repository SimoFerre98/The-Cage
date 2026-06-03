# Sprint 13: Ripristino Accesso Admin e Ottimizzazione Layout Globale

**Branch:** `sprint-13-admin-ui-layout`

## Obiettivi (INVEST)
1. **Indipendente**: Modifiche di layout grafico e ripristino di link di navigazione senza influenzare le funzionalità logiche o il backend Supabase.
2. **Negoziabile**: L'esatta posizione del pulsante di accesso ed i margini di spaziatura possono essere regolati in base al feedback visivo finale dell'utente.
3. **Di Valore (Valuable)**: Rende l'accesso all'area amministrativa visibile ed intuitivo sia da desktop che da mobile, e migliora il look-and-feel dell'admin dashboard risolvendo i testi "appiccicati" ed i layout compressi.
4. **Stimabile**: Basato su refactoring CSS e HTML dei componenti e del Layout Astro.
5. **Piccolo (Small)**: Incentrato sui fogli di stile e sulle classi contenitore del layout admin.
6. **Testable**: Verificare che l'ingranaggio admin sia visibile in alto a destra, e ispezionare le pagine admin per accertarsi che i testi abbiano margini e spaziature equilibrate e premium.

### Checklist
- [ ] Ripristinare il pulsante/icona ingranaggio (`⚙️`) per accedere a `/admin` in alto a destra nella topbar mobile/desktop all'interno di [Layout.astro](file:///c:/Users/s.ferrero/Code/The%20Cage/src/layouts/Layout.astro) e [LayoutLive.astro](file:///c:/Users/s.ferrero/Code/The%20Cage/src/layouts/LayoutLive.astro).
- [ ] Rimuovere il collegamento testuale "Area Admin" ed il relativo separatore nel footer delle pagine per pulire il fondo pagina ed evitare doppie vie d'accesso.
- [ ] Rivedere i padding, margin e larghezze contenitore nei moduli gestionali admin:
  - **`LoginForm.tsx`**: Centrare la scheda di login, allontanare i testi e gli input dai bordi (aumentare il padding interno da `p-4` a `p-6` o `p-8` con classi CSS responsive), aggiungere ombreggiature morbide.
  - **`Dashboard.tsx`**: Distanziare i pulsanti dei tab, allineare i testi, ed equilibrare lo spazio bianco.
  - **`TeamsPlayersManager.tsx`**, **`MatchesManager.tsx`**, **`LiveController.tsx`**, **`MVPManager.tsx`**: Aggiungere spaziatura uniforme tra input fields, titoli delle sezioni ed elenchi di dati. Evitare elementi addossati alle pareti delle schede glassmorphic.
- [ ] Assicurarsi che i testi delle tabelle e liste amministrative (es. nomi giocatori, date partite) abbiano spaziature generose (`px-4 py-3` o `py-4`) e allineamenti ordinati.

## Specifiche Tecniche
- Utilizzare variabili CSS di padding coerenti e classi CSS responsive (es. `p-6 md:p-10`) per garantire che i moduli gestionali respirino su schermi di ogni dimensione.
- Aggiungere transizioni fluide (`transition: all 0.3s ease`) sugli hover dei pulsanti amministrativi per valorizzare l'aspetto premium.
