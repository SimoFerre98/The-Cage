# Sprint 2: Schermata Admin - Gestione MVP

**Branch:** `sprint-2-admin-mvp`

## Obiettivi
1. Aggiungere un nuovo tab "Gestione MVP" nella Dashboard amministrativa.
2. Sviluppare il componente React `MVPManager.tsx` che si interfacci con Supabase per:
   - Visualizzare l'elenco completo dei giocatori registrati nel sistema.
   - Consentire all'amministratore di selezionare fino a 5 giocatori come candidati ufficiali per l'MVP settimanale, salvandoli nella tabella `mvp_candidates`.
   - Mostrare in tempo reale il numero totale dei voti ricevuti per ciascun candidato, interrogando `mvp_votes`.
   - Permettere all'admin di resettare tutti i voti MVP per avviare una nuova votazione (svuotando `mvp_candidates` e `mvp_votes`).

## Specifiche Tecniche
- Modificare [Dashboard.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/admin/Dashboard.tsx) per aggiungere un quarto tab "Gestione MVP" a fianco di "Squadre & Giocatori", "Calendario" e "Regia LIVE".
- Creare il nuovo file [MVPManager.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/admin/MVPManager.tsx).
- Usare query Supabase con realtime o reload periodico per il monitoraggio dei voti.
