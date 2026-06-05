import { useState, useEffect } from 'react';
import GlassEffect from './GlassEffect';
import { supabase } from '../lib/supabase';

const AVATAR_INITIALS = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

import { fetchWithCache } from '../lib/cache';

export default function HomeIsland() {
  const [tab, setTab] = useState<'squadre' | 'giocatori'>('squadre');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [playersAll, setPlayersAll] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const teamsWithPlayers = await fetchWithCache(
        'cage-teams-with-players',
        async () => {
          const { data } = await supabase
            .from('teams')
            .select('id, name, players(id, name)')
            .order('name');
          return data || [];
        },
        (newData) => {
          if (isMounted) updateTeamsUI(newData);
        }
      );

      if (isMounted) {
        updateTeamsUI(teamsWithPlayers);
      }
    }

    const updateTeamsUI = (tData: any[] | null) => {
      if (!tData || tData.length === 0) return;

      const processedTeams = tData.map((t, i) => {
        // Ordiniamo i giocatori per nome localmente per sicurezza
        const sortedPlayers = [...(t.players || [])].sort((a: any, b: any) => 
          a.name.localeCompare(b.name)
        );
        
        return {
          name: t.name,
          idx: i,
          players: sortedPlayers.map(p => p.name)
        };
      });
      setTeams(processedTeams);

      const allP = processedTeams.flatMap((t) =>
        t.players.map((p) => ({ name: p, team: t.name, idx: t.idx }))
      );
      setPlayersAll(allP);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggle = (i: number) => setExpanded(expanded === i ? null : i);

  return (
    <div>
      {/* Page Header integrated dynamically */}
      <div className="page-header">
        <h1 className="page-title">Home</h1>
        <p className="page-subtitle">Squadre e giocatori del torneo</p>
        <div className="accent-line"></div>
        <div className="flex gap-2 flex-wrap items-center justify-center mt-3.5">
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

    </div>
  );
}
