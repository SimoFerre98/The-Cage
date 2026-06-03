# Tabellone delle Attività di Ottimizzazione (The Cage)

Questo file rappresenta il **Punto di Tracciamento Centralizzato** di tutto il progetto. Serve a tracciare lo stato di completamento di ciascun blocco di lavoro (Sprint).

## Legenda degli Stati
- `[ ]` **Da completare**: Attività in coda.
- `[/]` **In corso**: Attività attualmente in fase di sviluppo (su branch dedicato).
- `[x]` **Completato**: Sviluppo terminato, verificato e mergiato nel branch `main`.

---

## Stato degli Sprint

### Sprint Precedenti (Completati)
- [x] **Sprint 1: Schema Database e Regole RLS**
  - **File di backlog**: [sprint-1-db-schema-and-rls.md](file:///c:/Users/s.ferrero/Code/The%20Cage/.agents/backlog/sprint-1-db-schema-and-rls.md)
- [x] **Sprint 2: Area Admin MVP**
  - **File di backlog**: [sprint-2-admin-mvp.md](file:///c:/Users/s.ferrero/Code/The%20Cage/.agents/backlog/sprint-2-admin-mvp.md)
- [x] **Sprint 3: Hub MVP Pubblico**
  - **File di backlog**: [sprint-3-public-mvp.md](file:///c:/Users/s.ferrero/Code/The%20Cage/.agents/backlog/sprint-3-public-mvp.md)
- [x] **Sprint 4: Correzione Timeline Live**
  - **File di backlog**: [sprint-4-live-timeline-fix.md](file:///c:/Users/s.ferrero/Code/The%20Cage/.agents/backlog/sprint-4-live-timeline-fix.md)
- [x] **Sprint 5: Semina Dati (Seeding) e Verifiche Finali**
  - **File di backlog**: [sprint-5-verification-and-seeding.md](file:///c:/Users/s.ferrero/Code/The%20Cage/.agents/backlog/sprint-5-verification-and-seeding.md)

### Sprint di Ottimizzazione (In Coda)
- [x] **Sprint 6: Caching SWR e Ottimizzazione Classifica**
  - **File di backlog**: [sprint-6-cache-swr-classifica.md](file:///c:/Users/s.ferrero/Code/The%20Cage/.agents/backlog/sprint-6-cache-swr-classifica.md)
  - **Branch**: `sprint-6-swr-classifica`
- [x] **Sprint 7: Caching SWR su Calendario e Home Page**
  - **File di backlog**: [sprint-7-cache-swr-calendario-home.md](file:///c:/Users/s.ferrero/Code/The%20Cage/.agents/backlog/sprint-7-cache-swr-calendario-home.md)
  - **Branch**: `sprint-7-swr-calendario-home`
- [x] **Sprint 8: Ottimizzazione Query Relazionali (Teams & Players)**
  - **File di backlog**: [sprint-8-relational-query-teams-players.md](file:///c:/Users/s.ferrero/Code/The%20Cage/.agents/backlog/sprint-8-relational-query-teams-players.md)
  - **Branch**: `sprint-8-teams-players-query`
- [x] **Sprint 9: Aggregazione Ottimizzata Voti MVP e Realtime**
  - **File di backlog**: [sprint-9-mvp-votes-aggregation.md](file:///c:/Users/s.ferrero/Code/The%20Cage/.agents/backlog/sprint-9-mvp-votes-aggregation.md)
  - **Branch**: `sprint-9-mvp-votes-aggregation`
- [x] **Sprint 10: Ottimizzazione Service Worker (PWA) e Compressione Asset**
  - **File di backlog**: [sprint-10-pwa-assets-optimization.md](file:///c:/Users/s.ferrero/Code/The%20Cage/.agents/backlog/sprint-10-pwa-assets-optimization.md)
  - **Branch**: `sprint-10-pwa-assets-optimization`
- [/] **Sprint 11: Lazy Loading Admin e Idratazione Differita**
  - **File di backlog**: [sprint-11-lazy-loading-hydration.md](file:///c:/Users/s.ferrero/Code/The%20Cage/.agents/backlog/sprint-11-lazy-loading-hydration.md)
  - **Branch**: `sprint-11-lazy-loading-hydration`

---

## Linee Guida per gli Agenti
Tutti gli agenti che lavorano su questo repository devono attenersi alle regole specificate in [.agents/RULES.md](file:///c:/Users/s.ferrero/Code/The%20Cage/.agents/RULES.md).
In sintesi:
1. Creare o estendere sempre il file della task nella cartella backlog prima di iniziare a lavorare.
2. Aggiornare lo stato in questo file (`task.md`) all'inizio (`[/]`) e alla fine (`[x]`) dello sviluppo di ciascun blocco di lavoro.
3. Lavorare sempre in un branch git separato, effettuando il merge su `main` solo al completamento dello sprint.
