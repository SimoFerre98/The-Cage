const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Carica variabili d'ambiente da .env
const envPath = path.join(__dirname, '../.env');
let databaseUrl = 'postgresql://postgres.yztuiiphzuayvorgrpbt:Tavernastallions98@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"\n\r']+)["']?/);
  if (match && match[1]) {
    databaseUrl = match[1];
  }
}

const targetDate = process.argv[2]; // AAAA-MM-GG o indefinito
let isAll = !targetDate;

if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
  console.error("Errore: il formato data deve essere AAAA-MM-GG (es: 2026-06-23)");
  process.exit(1);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

async function runBackup() {
  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    console.log('Connesso al database...');

    // Query per le partite
    let matchesQuery = `
      SELECT 
        m.id,
        m.match_date,
        m.round,
        m.status,
        m.home_score,
        m.away_score,
        ht.id as home_id,
        ht.name as home_name,
        at.id as away_id,
        at.name as away_name
      FROM public.matches m
      JOIN public.teams ht ON m.home_team_id = ht.id
      JOIN public.teams at ON m.away_team_id = at.id
    `;
    
    const queryParams = [];
    if (!isAll) {
      matchesQuery += ` WHERE m.match_date::date = $1`;
      queryParams.push(targetDate);
    }
    
    matchesQuery += ` ORDER BY m.match_date ASC`;

    const resMatches = await client.query(matchesQuery, queryParams);
    const matchesList = resMatches.rows;

    console.log(`Trovate ${matchesList.length} partite.`);

    const backupData = {
      date: isAll ? "all" : targetDate,
      matches: []
    };

    for (const match of matchesList) {
      // Query per gli eventi del match
      const resEvents = await client.query(`
        SELECT 
          e.id,
          e.minute,
          e.type,
          e.detail,
          t.name as team_name,
          p.name as player_name
        FROM public.match_events e
        LEFT JOIN public.teams t ON e.team_id = t.id
        LEFT JOIN public.players p ON e.player_id = p.id
        WHERE e.match_id = $1
        ORDER BY e.minute ASC, e.created_at ASC
      `, [match.id]);

      const events = resEvents.rows.map(e => ({
        id: e.id,
        match_id: match.id,
        minute: e.minute,
        type: e.type,
        detail: e.detail,
        team: e.team_name ? { name: e.team_name } : null,
        player: e.player_name ? { name: e.player_name } : null
      }));

      backupData.matches.push({
        id: match.id,
        match_date: match.match_date,
        round: match.round,
        status: match.status,
        home_score: match.home_score,
        away_score: match.away_score,
        home_team: {
          id: match.home_id,
          name: match.home_name
        },
        away_team: {
          id: match.away_id,
          name: match.away_name
        },
        events: events
      });
    }

    // Scrivi file JSON
    const jsonFileName = isAll ? `backup_all_${new Date().toISOString().split('T')[0]}.json` : `partite_${targetDate}.json`;
    const jsonFilePath = path.join(__dirname, jsonFileName);
    fs.writeFileSync(jsonFilePath, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`Backup JSON scritto in: ${jsonFilePath}`);

    // Costruisci CSV
    let csvContent = `RISULTATI DELLE PARTITE DEL ${isAll ? 'TUTTE' : targetDate};;;;;;;\n`;
    csvContent += `ID Partita;Data e Ora;Fase;Squadra Casa;Punteggio Casa;Punteggio Ospite;Squadra Ospite;Stato\n`;
    
    for (const m of backupData.matches) {
      const formattedDate = formatDate(m.match_date);
      csvContent += `${m.id};${formattedDate};${m.round};${m.home_team.name};${m.home_score};${m.away_score};${m.away_team.name};${m.status}\n`;
    }

    csvContent += `\n\nDETTAGLIO EVENTI DELLA GIORNATA (GOAL, CARTELLINI, CARTE KINGS LEAGUE);;;;;;;\n`;
    csvContent += `ID Partita;Partita;Minuto;Tipo Evento;Squadra;Giocatore;Dettaglio\n`;

    for (const m of backupData.matches) {
      for (const e of m.events) {
        const playerLabel = e.player ? e.player.name : '';
        const teamLabel = e.team ? e.team.name : '';
        const detailLabel = e.detail || '';
        csvContent += `${m.id};${m.home_team.name} - ${m.away_team.name};${e.minute}';${e.type};${teamLabel};${playerLabel};${detailLabel}\n`;
      }
    }

    const csvFileName = isAll ? `backup_all_${new Date().toISOString().split('T')[0]}.csv` : `partite_${targetDate}.csv`;
    const csvFilePath = path.join(__dirname, csvFileName);
    fs.writeFileSync(csvFilePath, csvContent, 'utf8');
    console.log(`Backup CSV scritto in: ${csvFilePath}`);

    console.log('Backup completato con successo!');
  } catch (err) {
    console.error('Errore durante il backup:', err);
  } finally {
    await client.end();
  }
}

runBackup();
