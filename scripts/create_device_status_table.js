import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

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

    // SQL per creare la tabella device_status, abilitare RLS e aggiungerla al realtime publication
    const query = `
      -- 1. Crea la tabella se non esiste
      CREATE TABLE IF NOT EXISTS public.device_status (
        id text PRIMARY KEY,
        last_seen timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- 2. Abilita RLS
      ALTER TABLE public.device_status ENABLE ROW LEVEL SECURITY;

      -- 3. Crea le policy di RLS
      DROP POLICY IF EXISTS "Allow public read of device_status" ON public.device_status;
      CREATE POLICY "Allow public read of device_status" ON public.device_status
        FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Allow all write for device_status" ON public.device_status;
      CREATE POLICY "Allow all write for device_status" ON public.device_status
        FOR ALL USING (true) WITH CHECK (true);

      -- 4. Inserisci il record di default per la centralina se non esiste
      INSERT INTO public.device_status (id, last_seen)
      VALUES ('esp32_centralina', now())
      ON CONFLICT (id) DO NOTHING;

      -- 5. Aggiungi la tabella alla pubblicazione realtime
      -- Per evitare errori se è già presente, rimuoviamo e aggiungiamo
      ALTER PUBLICATION supabase_realtime ADD TABLE public.device_status;
    `;

    await client.query(query);
    console.log("Tabella 'device_status' configurata con successo!");
  } catch (err) {
    // Se fallisce sul passo 5 perché è già presente nella pubblicazione, va bene lo stesso
    if (err.message && err.message.includes("already exists")) {
      console.log("Tabella 'device_status' configurata (era già presente nella pubblicazione realtime).");
    } else {
      console.error("Errore durante l'esecuzione del SQL:", err);
    }
  } finally {
    await client.end();
  }
}

main();
