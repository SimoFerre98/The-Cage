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
              <div className="flex items-center gap-4 p-3 cursor-pointer hover:bg-[rgba(255,255,255,0.05)] transition-colors border-b border-[var(--glass-border)]" onClick={() => toggle(i)}>
                <div className={`team-avatar avatar-${i}`} style={{ width: 42, height: 42, borderRadius: 14 }}>
                  {AVATAR_INITIALS(team.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="font-bold text-[0.95rem] text-[var(--text-primary)] leading-tight">{team.name}</div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mt-0.5">{team.players.length} giocatori</div>
                </div>
                <div className="text-[var(--text-muted)] text-sm transition-transform duration-300" style={{ transform: expanded === i ? 'rotate(180deg)' : 'rotate(0)' }}>▼</div>
              </div>

              {/* Player list */}
              <div
                className="transition-all duration-300 ease-[var(--ease-apple)] bg-[rgba(0,0,0,0.2)] shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]"
                style={{
                  overflow: 'hidden',
                  maxHeight: expanded === i ? `${team.players.length * 48}px` : '0px',
                }}
              >
                {team.players.map((player, j) => (
                  <div key={j} className="flex items-center gap-4 px-8 py-3 text-[0.9rem] border-b border-[var(--glass-border)] last:border-b-0">
                    <div className="text-[var(--text-muted)] font-mono text-xs w-4 text-center">{j + 1}</div>
                    <span className="font-medium text-[var(--text-secondary)]">{player}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'giocatori' && (
        <div className="glass-card animate-stagger">
          {PLAYERS_ALL.map((p, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-[var(--glass-border)] last:border-b-0">
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
