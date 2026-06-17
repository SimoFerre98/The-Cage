-- Add role column to players table
alter table public.players 
add column role text check (role in ('portiere', 'difensore', 'centrocampista', 'attaccante'));
