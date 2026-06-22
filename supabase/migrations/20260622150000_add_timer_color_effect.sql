-- Aggiunge le colonne color ed effect alla tabella timer_control
ALTER TABLE public.timer_control 
ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT 'RED',
ADD COLUMN IF NOT EXISTS effect text NOT NULL DEFAULT 'SOLID';
