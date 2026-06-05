# Sprint 12: Statistiche Giocatori Avanzate (Assist e Sanzioni)

**Branch:** `sprint-12-player-statistics`

## Obiettivi (INVEST)
1. **Indipendente**: Tratta l'introduzione di statistiche aggiuntive per i giocatori senza impattare sul conteggio dei gol o sulle regole di classifica delle squadre.
2. **Negoziabile**: Possiamo iniziare con gli assist e i cartellini (gialli/rossi) ed eventualmente estendere in futuro ad altre statistiche (es. clean sheets per i portieri).
3. **Di Valore (Valuable)**: Rende l'applicazione molto più simile a un portale sportivo completo (es. stile Kings League), mostrando statistiche chiave per giocatori non solo legati ai gol segnati.
4. **Stimabile**: Sfrutta lo stesso approccio basato su viste SQL Postgres e componenti React Tab utilizzati per i marcatori.
5. **Piccolo (Small)**: Circoscritto all'aggiunta di viste DB e modifiche alla UI della pagina Classifica e del Regia Controller.
6. **Testabile**: Possibilità di aggiungere un assist o ammonizione in Regia LIVE e verificare che compaia istantaneamente nelle classifiche dedicate del sito.

### Checklist
- [x] Creare una migrazione Supabase per definire le viste pubbliche `public.top_assists` e `public.top_cards`, e concedere i permessi di lettura (`GRANT SELECT`) ad utenti anonimi e autenticati.
- [x] Aggiornare il componente [ClassificaIsland.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/ClassificaIsland.tsx):
  - Aggiungere un menu di selezione sotto il tab "Giocatori" (Marcatori, Assistman, Sanzioni).
  - Interrogare le nuove viste `top_assists` e `top_cards` a seconda del tab attivo.
  - Creare layout a tabelle o liste per mostrare gli assistman ed i giocatori sanzionati con badge grafici per i cartellini gialli/rossi.
- [x] Aggiornare la console amministratore di regia LIVE in [LiveController.tsx](file:///c:/Users/s.ferrero/Code/The%20Cage/src/components/admin/LiveController.tsx) per consentire l'inserimento di eventi di tipo `ASSIST`.

## Specifiche Tecniche

### Viste SQL Postgres Proposte
```sql
-- Vista per gli Assist (Top Assistman)
create or replace view public.top_assists as
select
  p.id as player_id,
  p.name as player_name,
  t.name as team_name,
  count(e.id)::integer as assists
from public.players p
join public.teams t on p.team_id = t.id
left join public.match_events e on p.id = e.player_id and e.type = 'ASSIST'
group by p.id, p.name, t.name
having count(e.id) > 0
order by assists desc, player_name asc;

grant select on public.top_assists to anon, authenticated;

-- Vista per le Sanzioni (Cartellini)
create or replace view public.top_cards as
select
  p.id as player_id,
  p.name as player_name,
  t.name as team_name,
  sum(case when e.type = 'YELLOW_CARD' then 1 else 0 end)::integer as yellow_cards,
  sum(case when e.type = 'RED_CARD' then 1 else 0 end)::integer as red_cards
from public.players p
join public.teams t on p.team_id = t.id
left join public.match_events e on p.id = e.player_id and e.type in ('YELLOW_CARD', 'RED_CARD')
group by p.id, p.name, t.name
having count(e.id) > 0
order by red_cards desc, yellow_cards desc, player_name asc;

grant select on public.top_cards to anon, authenticated;
```
