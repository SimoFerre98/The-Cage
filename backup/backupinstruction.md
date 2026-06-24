# Backup Instruction for AI Agent

Sei l'assistente AI per **The Cage**. Questo file definisce la procedura standard per eseguire un backup delle partite e degli eventi del database di Supabase.

Quando l'utente richiede di "fare un backup delle partite", segui attentamente questa procedura:

## Procedura di Backup

### 1. Prerequisiti ed Ambiente
- Assicurati che le dipendenze siano installate (in particolare la libreria `pg` per Node.js).
- Leggi le credenziali di connessione dal file `.env` alla radice del progetto (`DATABASE_URL`). Se non presente, usa come fallback la stringa di connessione hardcoded presente in `seed_matches.js`.

### 2. Esecuzione del Script di Backup
Il backup viene eseguito tramite lo script Node.js posizionato in `backup/backup.cjs`.
Lo script supporta due modalità:
1. **Backup di una data specifica**: per salvare i risultati di una specifica giornata (es. ieri o oggi).
   ```bash
   node backup/backup.cjs AAAA-MM-GG
   ```
   *Esempio:* `node backup/backup.cjs 2026-06-23`
   Questo comando creerà i file `partite_20260623.json` e `partite_20260623.csv` nella cartella `backup/`.

2. **Backup completo (tutte le partite)**: per salvare l'intero database storico.
   ```bash
   node backup/backup.cjs
   ```
   Questo comando creerà i file `backup_all_AAAA-MM-GG.json` e `backup_all_AAAA-MM-GG.csv` nella cartella `backup/`.

### 3. Azioni da compiere per l'AI
1. Chiedi all'utente quale data desidera salvare (oppure esegui per la data odierna/ieri se specificato dall'utente, o un backup completo se richiesto).
2. Esegui il comando appropriato sul terminale posizionandoti nella cartella radice del progetto.
3. Verifica che i file JSON e CSV siano stati effettivamente generati all'interno della cartella `backup/`.
4. Mostra una sintesi del backup effettuato indicando quanti incontri ed eventi sono stati salvati.
