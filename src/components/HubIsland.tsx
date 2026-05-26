import { useState, useEffect } from 'react';
import GlassEffect from './GlassEffect';

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

const CANDIDATES = [
  { id: 'deluca', name: 'De Luca E.', team: 'Tama', highlight: 'Capocannoniere con 7 gol segnati', avatarIdx: 1 },
  { id: 'amato', name: 'Amato C.', team: 'Montarsolo', highlight: 'Trascinatore con 6 gol segnati', avatarIdx: 4 },
  { id: 'betti', name: 'Betti S.', team: 'Samu Betti', highlight: 'Migliore in campo (5 gol segnati)', avatarIdx: 8 },
  { id: 'rossi', name: 'Rossi L.', team: 'Amatori Calcio Genova', highlight: 'Doppietta decisiva (4 gol segnati)', avatarIdx: 0 },
  { id: 'fontana', name: 'Fontana C.', team: 'Mario', highlight: 'Regista difensivo (3 gol segnati)', avatarIdx: 2 },
];

const BASE_VOTES: Record<string, number> = {
  deluca: 54,
  amato: 42,
  betti: 35,
  rossi: 23,
  fontana: 15,
};

export default function HubIsland() {
  const [tab, setTab] = useState<'squadre' | 'giocatori' | 'voto'>('squadre');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [votedId, setVotedId] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>(BASE_VOTES);

  useEffect(() => {
    const savedVote = localStorage.getItem('cage-mvp-vote');
    if (savedVote) {
      setVotedId(savedVote);
      setVotes(prev => ({
        ...prev,
        [savedVote]: BASE_VOTES[savedVote] + 1
      }));
    }
  }, []);

  const handleVote = (id: string) => {
    localStorage.setItem('cage-mvp-vote', id);
    setVotedId(id);
    setVotes(prev => ({
      ...prev,
      [id]: prev[id] + 1
    }));
  };

  const handleReset = () => {
    if (votedId) {
      const id = votedId;
      localStorage.removeItem('cage-mvp-vote');
      setVotedId(null);
      setVotes(prev => ({
        ...prev,
        [id]: Math.max(BASE_VOTES[id], prev[id] - 1)
      }));
    }
  };

  const toggle = (i: number) => setExpanded(expanded === i ? null : i);

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

  return (
    <div>
      {/* Pill Toggle */}
      <div className="flex justify-center w-full mb-14 sticky top-[85px] md:top-8 z-[120] px-4 transition-all duration-300">
        <GlassEffect className="w-full max-w-[420px] rounded-[50px] p-2 cursor-pointer">
          <div className="relative flex w-full">
            <div 
              className="absolute top-0 bottom-0 w-1/3 bg-[rgba(59,130,246,0.3)] shadow-[inset_0_1px_4px_rgba(255,255,255,0.4)] rounded-[50px]" 
              style={{ 
                width: '33.333%',
                transform: tab === 'squadre' ? 'translateX(0)' : tab === 'giocatori' ? 'translateX(100%)' : 'translateX(200%)',
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            ></div>
            <button
              className={`flex-1 relative z-10 py-5 text-[0.9rem] md:text-[1rem] font-bold transition-all duration-300 tracking-wide outline-none ${tab === 'squadre' ? 'text-white drop-shadow-md' : 'text-white/50 hover:text-white/80'}`}
              onClick={() => setTab('squadre')}
            >
              Squadre
            </button>
            <button
              className={`flex-1 relative z-10 py-5 text-[0.9rem] md:text-[1rem] font-bold transition-all duration-300 tracking-wide outline-none ${tab === 'giocatori' ? 'text-white drop-shadow-md' : 'text-white/50 hover:text-white/80'}`}
              onClick={() => setTab('giocatori')}
            >
              Giocatori
            </button>
            <button
              className={`flex-1 relative z-10 py-5 text-[0.9rem] md:text-[1rem] font-bold transition-all duration-300 tracking-wide outline-none ${tab === 'voto' ? 'text-white drop-shadow-md' : 'text-white/50 hover:text-white/80'}`}
              onClick={() => setTab('voto')}
            >
              Vota MVP
            </button>
          </div>
        </GlassEffect>
      </div>

      {/* Squadre */}
      {tab === 'squadre' && (
        <div className="glass-card animate-stagger" style={{ marginTop: '2.5rem' }}>
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

      {/* Giocatori */}
      {tab === 'giocatori' && (
        <div className="glass-card animate-stagger" style={{ marginTop: '2.5rem' }}>
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

      {/* Votazione MVP */}
      {tab === 'voto' && (
        <div className="glass-card animate-stagger" style={{ marginTop: '2.5rem' }}>
          <div className="p-5 border-b border-[var(--glass-border)] bg-[rgba(255,255,255,0.01)]">
            <h3 className="text-[1.1rem] font-black text-white mb-1.5 uppercase tracking-wide flex items-center gap-2">
              Miglior Giocatore del Turno 🗳️
            </h3>
            <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed">
              Chi è stato l'MVP dell'ultima giornata di gare? Esprimi la tua preferenza. Puoi modificare la tua scelta in qualsiasi momento.
            </p>
          </div>

          <div>
            {CANDIDATES.map((c) => {
              const voteCount = votes[c.id] || 0;
              const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
              const hasVotedThis = votedId === c.id;

              return (
                <div 
                  key={c.id} 
                  className={`poll-option-card ${votedId && hasVotedThis ? 'poll-option-voted' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`team-avatar avatar-${c.avatarIdx}`} style={{ width: 38, height: 38, borderRadius: 12, fontSize: '0.65rem', flexShrink: 0, fontWeight: 800 }}>
                      {AVATAR_INITIALS(c.team)}
                    </div>

                    {/* Candidate Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 justify-between">
                        <span className="font-bold text-[0.95rem] text-white truncate">{c.name}</span>
                        <span className="text-[0.7rem] font-bold text-[var(--text-muted)] truncate">{c.team}</span>
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{c.highlight}</div>
                    </div>

                    {/* Action or Percentage */}
                    <div className="flex-shrink-0 ml-2">
                      {!votedId ? (
                        <button 
                          onClick={() => handleVote(c.id)}
                          className="poll-vote-btn"
                        >
                          Vota
                        </button>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <span className={`poll-percentage ${hasVotedThis ? 'poll-voted-percentage' : ''}`}>
                            {percentage}%
                          </span>
                          {hasVotedThis && (
                            <span className="poll-voted-badge">Votato</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {votedId && (
                    <div className="poll-progress-container">
                      <div 
                        className={`poll-progress-fill ${hasVotedThis ? 'poll-voted-fill' : ''}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reset button at footer if voted */}
          {votedId && (
            <div className="p-4 bg-[rgba(0,0,0,0.1)] border-t border-[var(--glass-border)] flex justify-between items-center">
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                Voti totali: <strong className="text-white">{totalVotes}</strong>
              </span>
              <button 
                onClick={handleReset}
                className="install-btn"
                style={{ margin: 0, padding: '0.45rem 1rem', background: 'rgba(255, 255, 255, 0.03)', fontSize: '0.75rem' }}
              >
                🔄 Cambia voto
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
