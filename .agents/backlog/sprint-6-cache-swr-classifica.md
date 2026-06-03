# Sprint 6: Cache SWR (Stale-While-Revalidate) & Classifica

**Branch:** `sprint-6-swr-classifica`

## Obiettivi (INVEST)
1. **Indipendente**: Isola l'implementazione del meccanismo di cache generico e la applica alla scheda Classifica, senza dipendere da altre ottimizzazioni.
2. **Negoziabile**: I parametri di TTL (Time-To-Live) e la scelta tra cache solo in memoria o anche `localStorage` possono essere calibrati durante lo sviluppo.
3. **Di Valore (Valuable)**: Rende istantaneo il caricamento della classifica alla navigazione ripetuta e riduce del 60% le query a Supabase per gli utenti comuni.
4. **Stimabile**: Lavoro circoscritto alla utility di cache e a un singolo componente.
5. **Piccolo (Small)**: Si concentra solo su un helper e un'isola React.
6. **Testabile**: Verificabile ispezionando la console e il pannello Network di Chrome/Firefox per contare le query a Supabase.

### Checklist
- [ ] Creare `src/lib/cache.ts` con una funzione helper `fetchWithCache<T>(key: string, fetchFn: () => Promise<T>, ttlMs?: number)` che utilizzi una cache globale in memoria (`window.__cage_cache`) e persista in `localStorage` per l'accesso offline.
- [ ] Integrare `fetchWithCache` all'interno di [ClassificaIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/ClassificaIsland.tsx) per le chiamate a `standings` e `top_scorers`.
- [ ] Implementare un comportamento Stale-While-Revalidate: se i dati sono presenti in cache (anche se scaduti), caricarli immediatamente per mostrare la classifica a 0ms di latenza, ed eseguire il fetch in background aggiornando la UI solo se il risultato differisce.

## Specifiche Tecniche
- La cache in memoria deve essere agganciata a un oggetto globale come `window` per far sì che persista durante le transizioni di pagina gestite da Astro View Transitions senza subire il reset del ciclo di vita dei componenti React.
- Chiavi di cache consigliate: `cage-standings`, `cage-top-scorers`.
- TTL standard consigliato: 5 minuti (`300000` ms).
