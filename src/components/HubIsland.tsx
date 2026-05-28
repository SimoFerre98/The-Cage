import { useState, useEffect } from 'react';
import GlassEffect from './GlassEffect';
import { supabase } from '../lib/supabase';

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
  const [tab, setTab] = useState<'squadre' | 'giocatori'>('squadre');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [votedId, setVotedId] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>(BASE_VOTES);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [playersAll, setPlayersAll] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const { data: teamsData } = await supabase.from('teams').select('id, name').order('name');
      const { data: playersData } = await supabase.from('players').select('id, name, team_id').order('name');
      
      if (teamsData && playersData) {
        const processedTeams = teamsData.map((t, i) => ({
          name: t.name,
          idx: i,
          players: playersData.filter(p => p.team_id === t.id).map(p => p.name)
        }));
        setTeams(processedTeams);

        const allP = processedTeams.flatMap((t) =>
          t.players.map((p) => ({ name: p, team: t.name, idx: t.idx }))
        );
        setPlayersAll(allP);
      }
    }
    loadData();

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
      {/* Page Header integrated dynamically */}
      <div className="page-header">
        <h1 className="page-title">Hub</h1>
        <p className="page-subtitle">Squadre e giocatori del torneo</p>
        <div className="accent-line"></div>
        <div className="flex gap-2 flex-wrap items-center mt-3.5">
          <div className="player-count-badge" style={{ marginTop: 0 }}>
            <span>👥</span>
            <span>{playersAll.length} giocatori</span>
          </div>
          <button 
            onClick={() => setShowVoteModal(true)}
            className="player-count-badge hover:bg-[rgba(59,130,246,0.2)] active:scale-95 transition-all cursor-pointer font-bold border border-[rgba(59,130,246,0.4)] bg-[rgba(59,130,246,0.1)] text-[#60a5fa] hover:text-white"
            style={{ marginTop: 0 }}
          >
            <span>🗳️</span>
            <span>Vota MVP</span>
          </button>
        </div>
      </div>

      {/* Pill Toggle */}
      <div className="flex justify-center w-full mb-14 sticky top-[85px] md:top-8 z-[120] px-4 transition-all duration-300">
        <GlassEffect className="w-full max-w-[300px] rounded-[50px] p-2.5 cursor-pointer">
          <div className="relative flex w-full">
            <div 
              className="absolute top-0 bottom-0 bg-[rgba(59,130,246,0.3)] shadow-[inset_0_1px_4px_rgba(255,255,255,0.4)] rounded-[50px]" 
              style={{ 
                width: '50%',
                transform: tab === 'squadre' ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            ></div>
            <button
              className={`flex-1 relative z-10 py-[22px] text-[0.95rem] md:text-[1.05rem] font-bold transition-all duration-300 tracking-wide outline-none ${tab === 'squadre' ? 'text-white drop-shadow-md' : 'text-white/50 hover:text-white/80'}`}
              onClick={() => setTab('squadre')}
            >
              Squadre
            </button>
            <button
              className={`flex-1 relative z-10 py-[22px] text-[0.95rem] md:text-[1.05rem] font-bold transition-all duration-300 tracking-wide outline-none ${tab === 'giocatori' ? 'text-white drop-shadow-md' : 'text-white/50 hover:text-white/80'}`}
              onClick={() => setTab('giocatori')}
            >
              Giocatori
            </button>
          </div>
        </GlassEffect>
      </div>

      {/* Squadre */}
      {tab === 'squadre' && (
        <div className="glass-card animate-stagger" style={{ marginTop: '2.5rem' }}>
          {teams.map((team, i) => (
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
          {playersAll.map((p, i) => (
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

      {/* MVP Voting Modal Overlay */}
      {showVoteModal && (
        <div className="modal-overlay" onClick={() => setShowVoteModal(false)} style={{ zIndex: 99999 }}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-[450px] animate-[modalSlideUp_0.4s_var(--ease-spring)] px-4">
            <GlassEffect className="w-full rounded-[24px] p-6 md:p-8 relative overflow-hidden" style={{ display: 'block' }}>
              {/* Ambient background glows */}
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[rgba(59,130,246,0.35)] blur-[40px] pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[rgba(139,92,246,0.3)] blur-[40px] pointer-events-none" />

              <div className="relative">
                {/* Header */}
                <div className="grid grid-cols-[32px_1fr_32px] gap-3 items-start mb-5 pt-3 px-1 md:px-3">
                  {/* Spacer to keep title perfectly centered */}
                  <div className="w-8 h-8 pointer-events-none"></div>

                  <div className="flex flex-col items-center justify-center">
                    <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-white drop-shadow flex justify-center items-center flex-wrap gap-x-1.5 gap-y-1 leading-tight text-center">
                      <span>Vota MVP del Turno</span>
                      <span className="text-[1.1em]">🗳️</span>
                    </h3>
                    <div className="h-[2px] w-12 mt-2 rounded bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] mx-auto" />
                  </div>
                  
                  <button 
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-red-600/40 hover:from-red-500/40 hover:to-red-600/60 border border-red-500/30 text-red-100 transition-all duration-300 hover:rotate-90 active:scale-95 cursor-pointer outline-none shadow-[0_0_10px_rgba(239,68,68,0.2)] justify-self-end"
                    onClick={() => setShowVoteModal(false)}
                    aria-label="Chiudi"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <p className="text-[0.75rem] md:text-xs font-semibold text-[var(--text-muted)] leading-relaxed mb-6 px-6 md:px-8 text-center">
                  Chi è stato l'MVP dell'ultima giornata di gare? Esprimi la tua preferenza. Puoi modificare la tua scelta in qualsiasi momento.
                </p>

                {/* Candidates List */}
                <div className="flex flex-col gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {CANDIDATES.map((c) => {
                    const voteCount = votes[c.id] || 0;
                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                    const hasVotedThis = votedId === c.id;

                    return (
                      <div 
                        key={c.id} 
                        className={`poll-option-card rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-4 ${votedId && hasVotedThis ? 'poll-option-voted' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className={`team-avatar avatar-${c.avatarIdx}`} style={{ width: 34, height: 34, borderRadius: 10, fontSize: '0.6rem', flexShrink: 0, fontWeight: 800 }}>
                            {AVATAR_INITIALS(c.team)}
                          </div>

                          {/* Candidate Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 justify-between">
                              <span className="font-bold text-sm text-white truncate">{c.name}</span>
                              <span className="text-[0.65rem] font-bold text-[var(--text-muted)] truncate">{c.team}</span>
                            </div>
                            <div className="text-[0.7rem] text-[var(--text-muted)] mt-0.5 truncate">{c.highlight}</div>
                          </div>

                          {/* Action or Percentage */}
                          <div className="flex-shrink-0 ml-2">
                            {!votedId ? (
                              <button 
                                onClick={() => handleVote(c.id)}
                                className="poll-vote-btn"
                                style={{ padding: '0.35rem 0.8rem', fontSize: '0.7rem' }}
                              >
                                Vota
                              </button>
                            ) : (
                              <div className="flex flex-col items-end gap-0.5">
                                <span className={`poll-percentage text-sm ${hasVotedThis ? 'poll-voted-percentage' : ''}`}>
                                  {percentage}%
                                </span>
                                {hasVotedThis && (
                                  <span className="poll-voted-badge" style={{ padding: '0.15rem 0.4rem', fontSize: '0.55rem' }}>Votato</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {votedId && (
                          <div className="poll-progress-container" style={{ height: 6, marginTop: '0.5rem' }}>
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
                  <div className="mt-4 pt-4 border-t border-[var(--glass-border)] flex justify-between items-center">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      Voti totali: <strong className="text-white">{totalVotes}</strong>
                    </span>
                    <button 
                      onClick={handleReset}
                      className="install-btn"
                      style={{ margin: 0, padding: '0.4rem 0.9rem', background: 'rgba(255, 255, 255, 0.03)', fontSize: '0.7rem' }}
                    >
                      🔄 Cambia voto
                    </button>
                  </div>
                )}
              </div>
            </GlassEffect>
          </div>
        </div>
      )}
    </div>
  );
}
