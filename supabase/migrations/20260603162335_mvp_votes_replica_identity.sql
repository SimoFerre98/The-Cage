-- Alter mvp_votes replica identity to full to ensure delete events contain player_id
alter table public.mvp_votes replica identity full;
