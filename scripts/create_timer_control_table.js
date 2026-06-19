import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leggi .env
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const connectionString = env.DATABASE_URL;

if (!connectionString) {
  console.error("Errore: DATABASE_URL non definito nel file .env");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    await client.connect();
    console.log("Connesso al database di Supabase...");

    const query = `
      -- 1. Crea la tabella se non esiste
      CREATE TABLE IF NOT EXISTS public.timer_control (
        id text PRIMARY KEY,
        command text NOT NULL DEFAULT 'STOP',
        duration integer NOT NULL DEFAULT 9,
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- 2. Abilita RLS
      ALTER TABLE public.timer_control ENABLE ROW LEVEL SECURITY;

      -- 3. Crea le policy di RLS
      DROP POLICY IF EXISTS "Allow public read of timer_control" ON public.timer_control;
      CREATE POLICY "Allow public read of timer_control" ON public.timer_control
        FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Allow all write for timer_control" ON public.timer_control;
      CREATE POLICY "Allow all write for timer_control" ON public.timer_control
        FOR ALL USING (true) WITH CHECK (true);

      -- 4. Funzione e trigger per l'aggiornamento automatico di updated_at
      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
         NEW.updated_at = timezone('utc'::text, now());
         RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_update_timer_control_updated_at ON public.timer_control;
      CREATE TRIGGER trg_update_timer_control_updated_at
      BEFORE UPDATE ON public.timer_control
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();

      -- 5. Inserisci il record di default se non esiste
      INSERT INTO public.timer_control (id, command, duration, updated_at)
      VALUES ('timer_1', 'STOP', 9, now())
      ON CONFLICT (id) DO NOTHING;

      -- 6. Aggiungi la tabella alla pubblicazione realtime
      -- Per evitare errori se è già presente, rimuoviamo e aggiungiamo
      ALTER PUBLICATION supabase_realtime ADD TABLE public.timer_control;
    `;

    await client.query(query);
    console.log("Tabella 'timer_control' configurata con successo!");
  } catch (err) {
    if (err.message && err.message.includes("already exists")) {
      console.log("Tabella 'timer_control' configurata (era già presente nella pubblicazione realtime).");
    } else {
      console.error("Errore durante l'esecuzione del SQL:", err);
    }
  } finally {
    await client.end();
  }
}

main();
