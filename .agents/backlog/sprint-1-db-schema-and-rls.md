# Sprint 1: Schema DB e RLS (Voto MVP & Dati di Test)

**Branch:** `sprint-1-db-schema-rls`

## Obiettivi
1. Creare la tabella `public.mvp_candidates` in Supabase per contenere l'elenco dei giocatori candidati all'MVP per il turno.
2. Impostare le corrette politiche di sicurezza Row Level Security (RLS) su `mvp_candidates` (accesso di lettura a tutti, scrittura/modifica solo per admin autenticati).
3. Verificare e perfezionare le politiche RLS su `mvp_votes` per assicurare che gli utenti non registrati (anonimi) possano votare specificando il proprio `voter_id` e che l'admin abbia controllo totale.
4. Popolare il database remoto Supabase con dati di test per testare i vari flussi di lavoro (squadre, giocatori, partite, eventi e voti).

## Specifiche Tecniche
### Nuova Tabella `public.mvp_candidates`
```sql
create table public.mvp_candidates (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### RLS Policies
- **mvp_candidates**:
  ```sql
  alter table public.mvp_candidates enable row level security;
  create policy "Lettura pubblica candidati MVP" on public.mvp_candidates for select using (true);
  create policy "Admin controllo totale candidati MVP" on public.mvp_candidates for all to authenticated using (true) with check (true);
  ```

- **mvp_votes**:
  ```sql
  -- Assicurarsi che gli utenti anonimi possano inserire i voti:
  create policy "Anonymous users can insert mvp_votes" on public.mvp_votes for insert with check (true);
  ```

## Istruzioni
1. Creare la migration locale ed eseguirla su Supabase remoto.
2. Inserire script SQL o JS per aggiungere squadre e giocatori di test, oltre a partite programmate ed eventi live per validare il sistema.
