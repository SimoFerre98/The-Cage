const { Client } = require('pg');

const MATCHES = [
  { date: '2026-05-19 21:00:00+02', round: 'Girone A', status: 'TERMINATA', home: 'Gli Umili', away: 'Tama', score: '4 - 2' },
  { date: '2026-05-19 21:30:00+02', round: 'Girone A', status: 'TERMINATA', home: 'Amatori Calcio Genova', away: 'Sezione 104', score: '3 - 1' },
  { date: '2026-05-21 21:00:00+02', round: 'Girone A', status: 'TERMINATA', home: 'Aston Birra', away: 'UCG (Bairon)', score: '2 - 2' },
  { date: '2026-05-21 21:30:00+02', round: 'Girone A', status: 'TERMINATA', home: 'Taverna', away: 'Mario', score: '1 - 3' },
  { date: '2026-05-22 21:00:00+02', round: 'Girone B', status: 'TERMINATA', home: 'Lo Dico FC', away: 'chainz', score: '5 - 2' },
  { date: '2026-05-22 21:30:00+02', round: 'Girone B', status: 'TERMINATA', home: 'FcPontos', away: 'Gli Umili', score: '0 - 2' },
  { date: '2026-05-26 21:00:00+02', round: 'Girone A', status: 'PROSSIMA', home: 'Tama', away: 'Sezione 104', score: null },
  { date: '2026-05-28 21:30:00+02', round: 'Girone A', status: 'LIVE', home: 'Amatori Calcio Genova', away: 'Gli Umili', score: '2 - 1' },
  { date: '2026-05-28 21:00:00+02', round: 'Girone B', status: 'PROSSIMA', home: 'UCG (Bairon)', away: 'Lo Dico FC', score: null },
  { date: '2026-05-28 21:30:00+02', round: 'Girone B', status: 'PROSSIMA', home: 'chainz', away: 'Mario', score: null },
];

async function seed() {
  const client = new Client({
    connectionString: 'postgresql://postgres.yztuiiphzuayvorgrpbt:Tavernastallions98@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
  });
  
  try {
    await client.connect();
    console.log('Connected to DB');

    for (const m of MATCHES) {
      const homeRes = await client.query('SELECT id FROM public.teams WHERE name = $1', [m.home]);
      const awayRes = await client.query('SELECT id FROM public.teams WHERE name = $1', [m.away]);
      
      const homeId = homeRes.rows[0].id;
      const awayId = awayRes.rows[0].id;

      let homeScore = 0;
      let awayScore = 0;
      
      if (m.score) {
        const parts = m.score.split('-');
        homeScore = parseInt(parts[0].trim());
        awayScore = parseInt(parts[1].trim());
      }

      await client.query(`
        INSERT INTO public.matches (home_team_id, away_team_id, match_date, round, status, home_score, away_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [homeId, awayId, m.date, m.round, m.status, homeScore, awayScore]);
      
      console.log('Inserted match', m.home, 'vs', m.away);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

seed();
