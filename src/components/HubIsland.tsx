import { useState } from 'react';

const TEAMS = [
  {
    name: 'Amatori Calcio Genova',
    players: ['Rossi L.', 'Ferrari M.', 'Bianchi A.', 'Colombo G.', 'Gallo R.', 'Esposito D.', 'Romano F.', 'Ricci C.', 'Marino S.'],
  },
  {
    name: 'Tama',
    players: ['Conti P.', 'Bruno T.', 'Russo V.', 'De Luca E.', 'Costa M.', 'Greco N.', 'Rizzo L.', 'Lombardi A.', 'Barbieri G.'],
  },
  {
    name: 'Mario',
    players: ['Fontana C.', 'Santoro R.', 'Mariani L.', 'Rinaldi M.', 'Caruso A.', 'Ferretti D.', 'Galli S.', 'Palumbo F.', 'Mancini L.'],
  },
  {
    name: 'Corsi',
    players: ['Vitale P.', 'Leone T.', 'Serra E.', 'Conte G.', 'Pellegrini M.', 'Catalano R.', 'Longo A.', 'Morano D.', 'Fiore N.'],
  },
  {
    name: 'Montarsolo',
    players: ['Amato C.', 'Silvestri L.', 'Sanna M.', 'Fabbri P.', 'Marchetti T.', 'De Angelis R.', 'Villa A.', 'Poli G.', 'Gentile S.'],
  },
  {
    name: 'Dario',
    players: ['Ferrara M.', 'Neri C.', 'Basile L.', 'Riva T.', 'Croci P.', 'Bianco E.', 'Monti G.', 'Pagano R.', 'Guerra A.'],
  },
  {
    name: 'Taverna',
    players: ['Sala M.', 'Benedetti L.', 'Caputo T.', 'Farina P.', 'Rossetti E.', 'Negri G.', 'Pellegrino C.', 'Grassi R.', 'Palermo A.'],
  },
  {
    name: 'UCG (Bairon)',
    players: ['Ruggiero M.', 'Mazza L.', 'Cattaneo T.', 'Greco P.', 'Ferrario E.', 'Pinto G.', 'Martinelli C.', 'Gatti R.', 'D\'Amico A.'],
  },
  {
    name: 'Samu Betti',
    players: ['Betti S.', 'Moretti L.', 'Tosi T.', 'Messina P.', 'Coppola E.', 'Sartori G.', 'Rizzi C.', 'Vitali R.', 'Piazza A.'],
  },
  {
    name: 'chainz Andrea Robbiano',
    players: ['Robbiano A.', 'Sacco M.', 'Valenti L.', 'Ferretti T.', 'Cini P.', 'Donati E.', 'Proietti G.', 'Milani C.', 'Guerra R.'],
  },
  {
    name: 'Martino Gonzalez',
    players: ['Gonzalez M.', 'Moreno L.', 'Alvarez T.', 'Rodriguez P.', 'Garcia E.', 'Lopez G.', 'Martinez C.', 'Sanchez R.', 'Fernandez A.'],
  },
];

const PLAYERS_ALL = TEAMS.flatMap((t, ti) =>
  t.players.map((p, pi) => ({ name: p, team: t.name, idx: ti }))
);

const AVATAR_INITIALS = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export default function HubIsland() {
  const [tab, setTab] = useState<'squadre' | 'giocatori'>('squadre');
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggle = (i: number) => setExpanded(expanded === i ? null : i);

  return (
    <div>
      {/* Pill Toggle */}
      <div className="section-header" style={{ justifyContent: 'center' }}>
        <div className="pill-toggle-container" style={{ width: '100%', maxWidth: '300px' }}>
          <div 
            className="pill-indicator" 
            style={{ transform: tab === 'squadre' ? 'translateX(0)' : 'translateX(100%)' }}
          ></div>
          <button
            className={`pill-btn ${tab === 'squadre' ? 'active' : ''}`}
            onClick={() => setTab('squadre')}
          >
            Squadre
          </button>
          <button
            className={`pill-btn ${tab === 'giocatori' ? 'active' : ''}`}
            onClick={() => setTab('giocatori')}
          >
            Giocatori
          </button>
        </div>
      </div>

      {/* Squadre */}
      {tab === 'squadre' && (
        <div className="glass-card animate-stagger">
          {TEAMS.map((team, i) => (
            <div key={i}>
              <div className="team-row" onClick={() => toggle(i)}>
                <div className={`team-avatar avatar-${i}`} style={{ width: 42, height: 42, borderRadius: 14 }}>
                  {AVATAR_INITIALS(team.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="team-name" style={{ fontSize: '0.95rem' }}>{team.name}</div>
                  <div className="team-meta">{team.players.length} giocatori</div>
                </div>
                <div className={`chevron ${expanded === i ? 'open' : ''}`}>▼</div>
              </div>

              {/* Player list */}
              <div
                className="player-list"
                style={{
                  maxHeight: expanded === i ? `${team.players.length * 48}px` : '0px',
                  background: 'rgba(0,0,0,0.2)',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)',
                }}
              >
                {team.players.map((player, j) => (
                  <div key={j} className="player-item" style={{ padding: '0.7rem 1.2rem 0.7rem 2.2rem' }}>
                    <div className="player-number">{j + 1}</div>
                    <span style={{ fontWeight: 500 }}>{player}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Giocatori */}
      {tab === 'giocatori' && (
        <div className="glass-card animate-stagger">
          {PLAYERS_ALL.map((p, i) => (
            <div key={i} className="player-item" style={{ padding: '0.85rem 1.2rem', borderBottom: '1px solid var(--border)' }}>
              <div className={`team-avatar avatar-${p.idx}`} style={{ width: 32, height: 32, borderRadius: 10, fontSize: '0.7rem' }}>
                {AVATAR_INITIALS(p.team)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.team}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
