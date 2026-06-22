const { Client } = require('pg');

const MATCHES = [
  // Lunedì 22
  { date: '2026-06-22 19:30:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'FC Pontos', away: 'Amatori Calcio Genova', score: null },
  { date: '2026-06-22 20:05:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'Gli Umili', away: 'Sezione 164', score: null },
  { date: '2026-06-22 20:40:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'FC Ceres', away: 'FC Murta', score: null },
  { date: '2026-06-22 21:15:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'Sezione 164', away: 'Amatori Calcio Genova', score: null },
  { date: '2026-06-22 21:50:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'FC Murta', away: 'FC Pontos', score: null },
  { date: '2026-06-22 22:25:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'FC Ceres', away: 'Gli Umili', score: null },
  // Martedì 23
  { date: '2026-06-23 18:55:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'UCG', away: 'Gilly Boys', score: null },
  { date: '2026-06-23 19:30:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'Taverna FC', away: 'Aston Birra', score: null },
  { date: '2026-06-23 20:05:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'Pontex Pirates', away: 'Lo Dico FC', score: null },
  { date: '2026-06-23 20:40:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'Gilly Boys', away: 'San Teodoro Ketzmaja', score: null },
  { date: '2026-06-23 21:15:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'Chainz', away: 'Taverna FC', score: null },
  { date: '2026-06-23 21:50:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'Aston Birra', away: 'UCG', score: null },
  { date: '2026-06-23 22:25:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'San Teodoro Ketzmaja', away: 'Pontex Pirates', score: null },
  { date: '2026-06-23 23:00:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'Lo Dico FC', away: 'Chainz', score: null },
  // Mercoledì 24
  { date: '2026-06-24 18:55:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'Gli Umili', away: 'Lo Dico FC', score: null },
  { date: '2026-06-24 19:30:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'FC Murta', away: 'Chainz', score: null },
  { date: '2026-06-24 20:05:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'San Teodoro Ketzmaja', away: 'FC Ceres', score: null },
  { date: '2026-06-24 20:40:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'Aston Birra', away: 'Lo Dico FC', score: null },
  { date: '2026-06-24 21:15:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'Gli Umili', away: 'UCG', score: null },
  { date: '2026-06-24 21:50:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'San Teodoro Ketzmaja', away: 'Chainz', score: null },
  { date: '2026-06-24 22:25:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'FC Murta', away: 'Aston Birra', score: null },
  { date: '2026-06-24 23:00:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'FC Ceres', away: 'UCG', score: null },
  // Giovedì 25
  { date: '2026-06-25 19:30:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'Sezione 164', away: 'Gilly Boys', score: null },
  { date: '2026-06-25 20:05:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'Pontex Pirates', away: 'Amatori Calcio Genova', score: null },
  { date: '2026-06-25 20:40:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'FC Pontos', away: 'Taverna FC', score: null },
  { date: '2026-06-25 21:15:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'Sezione 164', away: 'Pontex Pirates', score: null },
  { date: '2026-06-25 21:50:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'FC Pontos', away: 'Gilly Boys', score: null },
  { date: '2026-06-25 22:25:00+02', round: 'Fase a Gironi', status: 'PROSSIMA', home: 'Amatori Calcio Genova', away: 'Taverna FC', score: null }
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
