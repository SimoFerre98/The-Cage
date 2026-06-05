import { useState, useEffect } from 'react';
import GlassEffect from './GlassEffect';
import { supabase } from '../lib/supabase';
import PlayerStatsModal from './PlayerStatsModal';

const LEGEND = [
  { label: 'PT', desc: 'Punti totali' },
  { label: 'G',  desc: 'Partite giocate' },
  { label: 'V',  desc: 'Vittorie' },
  { label: 'N',  desc: 'Pareggi' },
  { label: 'P',  desc: 'Sconfitte' },
  { label: 'GF', desc: 'Gol fatti' },
  { label: 'GS', desc: 'Gol subiti' },
];

const AVATAR_INITIALS = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const AVATAR_IDX: Record<string, number> = {
  'Amatori Calcio Genova': 0,
  'Tama': 1,
  'Mario': 2,
  'Corsi': 3,
  'Montarsolo': 4,
  'Dario': 5,
  'Taverna': 6,
  'UCG (Bairon)': 7,
  'Samu Betti': 8,
  'chainz Andrea Robbiano': 9,
  'Martino Gonzalez': 10,
};

import { fetchWithCache } from '../lib/cache';

export default function ClassificaIsland() {
  const [tab, setTab] = useState<'squadre' | 'giocatori'>('squadre');
  const [subTab, setSubTab] = useState<'marcatori' | 'assist' | 'sanzioni'>('marcatori');
  const [showLegend, setShowLegend] = useState(false);
  const [standings, setStandings] = useState<any[]>([]);
  const [scorers, setScorers] = useState<any[]>([]);
  const [assists, setAssists] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let debounceTimer: any = null;

    async function loadData(force = false) {
      const fetchStandings = async () => {
        const { data } = await supabase.from('standings').select('*');
        return data || [];
      };

      const fetchScorers = async () => {
        const { data } = await supabase.from('top_scorers').select('*');
        return data || [];
      };

      const fetchAssists = async () => {
        const { data } = await supabase.from('top_assists').select('*');
        return data || [];
      };

      const fetchCards = async () => {
        const { data } = await supabase.from('top_cards').select('*');
        return data || [];
      };

      if (force) {
        try {
          const [freshStandings, freshScorers, freshAssists, freshCards] = await Promise.all([
            fetchStandings(),
            fetchScorers(),
            fetchAssists(),
            fetchCards(),
          ]);
          if (isMounted) {
            setStandings(freshStandings);
            setScorers(freshScorers);
            setAssists(freshAssists);
            setCards(freshCards);

            // Aggiorna cache locale
            const win = window as any;
            if (!win.__cage_cache) win.__cage_cache = {};

            win.__cage_cache['cage-standings'] = { data: freshStandings, timestamp: Date.now() };
            localStorage.setItem('cage-standings', JSON.stringify({ data: freshStandings, timestamp: Date.now() }));

            win.__cage_cache['cage-top-scorers'] = { data: freshScorers, timestamp: Date.now() };
            localStorage.setItem('cage-top-scorers', JSON.stringify({ data: freshScorers, timestamp: Date.now() }));

            win.__cage_cache['cage-top-assists'] = { data: freshAssists, timestamp: Date.now() };
            localStorage.setItem('cage-top-assists', JSON.stringify({ data: freshAssists, timestamp: Date.now() }));

            win.__cage_cache['cage-top-cards'] = { data: freshCards, timestamp: Date.now() };
            localStorage.setItem('cage-top-cards', JSON.stringify({ data: freshCards, timestamp: Date.now() }));
          }
        } catch (e) {
          console.error('Errore durante il rinfresco forzato della classifica:', e);
        }
        return;
      }

      const standingsPromise = fetchWithCache(
        'cage-standings',
        fetchStandings,
        (newData) => {
          if (isMounted) setStandings(newData);
        }
      );

      const scorersPromise = fetchWithCache(
        'cage-top-scorers',
        fetchScorers,
        (newData) => {
          if (isMounted) setScorers(newData);
        }
      );

      const assistsPromise = fetchWithCache(
        'cage-top-assists',
        fetchAssists,
        (newData) => {
          if (isMounted) setAssists(newData);
        }
      );

      const cardsPromise = fetchWithCache(
        'cage-top-cards',
        fetchCards,
        (newData) => {
          if (isMounted) setCards(newData);
        }
      );

      const [cachedStandings, cachedScorers, cachedAssists, cachedCards] = await Promise.all([
        standingsPromise,
        scorersPromise,
        assistsPromise,
        cardsPromise,
      ]);
      
      if (isMounted) {
        if (cachedStandings) setStandings(cachedStandings);
        if (cachedScorers) setScorers(cachedScorers);
        if (cachedAssists) setAssists(cachedAssists);
        if (cachedCards) setCards(cachedCards);
        setLoading(false);
      }
    }

    loadData();

    const triggerRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadData(true);
      }, 2000);
    };

    // Sottoscrizione realtime per classifica, marcatori, assist e sanzioni
    const channel = supabase.channel('classifica_realtime_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload: any) => {
        const oldStatus = payload.old?.status;
        const newStatus = payload.new?.status;
        const oldHomeScore = payload.old?.home_score;
        const newHomeScore = payload.new?.home_score;
        const oldAwayScore = payload.old?.away_score;
        const newAwayScore = payload.new?.away_score;

        // Aggiorna solo se una partita è terminata (o era terminata prima) e c'è stato un cambio di stato o punteggio
        const wasOrIsTerminata = oldStatus === 'TERMINATA' || newStatus === 'TERMINATA';
        const scoreChanged = oldHomeScore !== newHomeScore || oldAwayScore !== newAwayScore;
        const statusChanged = oldStatus !== newStatus;

        if (wasOrIsTerminata && (scoreChanged || statusChanged)) {
          triggerRefresh();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_events' }, (payload: any) => {
        const oldType = payload.old?.type;
        const newType = payload.new?.type;

        // Aggiorna se l'evento inserito/eliminato/modificato è rilevante
        const relevantTypes = ['GOAL', 'ASSIST', 'AMMONIZIONE', 'ESPULSIONE'];
        if (relevantTypes.includes(oldType) || relevantTypes.includes(newType)) {
          triggerRefresh();
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div>
      {/* Legenda Header Button Centered (above sticky bar to avoid mobile squeezing) */}
      <div className="flex justify-center w-full mb-6">
        <button
          onClick={() => setShowLegend(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-bold transition-all cursor-pointer outline-none active:scale-95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
          aria-label="Info legenda"
        >
          <span>Legenda Classifica</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 opacity-70">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>
      </div>

      {/* Controls Container */}
      <div className="flex justify-center w-full mb-10 mt-6 sticky top-[85px] md:top-8 z-[120] px-4 transition-all duration-300">
        <div className="flex justify-center w-full max-w-[360px]">
          
          {/* Chips Toggle */}
          <div className="flex justify-center gap-3 w-full">
            <button
              onClick={() => setTab('squadre')}
              className={`flex-1 py-3 rounded-full font-bold text-[1rem] transition-all border duration-300 cursor-pointer outline-none backdrop-blur-md backdrop-saturate-[180%] ${
                tab === 'squadre'
                  ? 'bg-[rgba(59,130,246,0.3)] text-white border-[rgba(59,130,246,0.5)] shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_4px_rgba(255,255,255,0.2)] scale-105'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
              }`}
            >
              Squadre
            </button>
            <button
              onClick={() => setTab('giocatori')}
              className={`flex-1 py-3 rounded-full font-bold text-[1rem] transition-all border duration-300 cursor-pointer outline-none backdrop-blur-md backdrop-saturate-[180%] ${
                tab === 'giocatori'
                  ? 'bg-[rgba(59,130,246,0.3)] text-white border-[rgba(59,130,246,0.5)] shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_4px_rgba(255,255,255,0.2)] scale-105'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
              }`}
            >
              Giocatori
            </button>
          </div>

        </div>
      </div>

      {/* Subtabs for Giocatori */}
      {tab === 'giocatori' && (
        <div className="flex justify-center gap-3 w-full max-w-[360px] mx-auto mb-10 -mt-4 sticky top-[150px] md:top-24 z-[115] transition-all duration-300">
          <button
            onClick={() => setSubTab('marcatori')}
            className={`flex-1 py-2 rounded-full font-bold text-[0.85rem] transition-all border duration-300 cursor-pointer outline-none backdrop-blur-md backdrop-saturate-[180%] ${
              subTab === 'marcatori'
                ? 'bg-[rgba(59,130,246,0.3)] text-white border-[rgba(59,130,246,0.5)] shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_4px_rgba(255,255,255,0.2)] scale-105'
                : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
            }`}
          >
            Marcatori
          </button>
          <button
            onClick={() => setSubTab('assist')}
            className={`flex-1 py-2 rounded-full font-bold text-[0.85rem] transition-all border duration-300 cursor-pointer outline-none backdrop-blur-md backdrop-saturate-[180%] ${
              subTab === 'assist'
                ? 'bg-[rgba(59,130,246,0.3)] text-white border-[rgba(59,130,246,0.5)] shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_4px_rgba(255,255,255,0.2)] scale-105'
                : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
            }`}
          >
            Assistman
          </button>
          <button
            onClick={() => setSubTab('sanzioni')}
            className={`flex-1 py-2 rounded-full font-bold text-[0.85rem] transition-all border duration-300 cursor-pointer outline-none backdrop-blur-md backdrop-saturate-[180%] ${
              subTab === 'sanzioni'
                ? 'bg-[rgba(59,130,246,0.3)] text-white border-[rgba(59,130,246,0.5)] shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_4px_rgba(255,255,255,0.2)] scale-105'
                : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
            }`}
          >
            Sanzioni
          </button>
        </div>
      )}

      {/* Classifica Squadre */}
      {tab === 'squadre' && (
        <div className="glass-card animate-stagger" style={{ padding: '0.5rem 0', overflowX: 'auto', marginTop: '2.5rem' }}>
          <table className="w-full border-collapse" style={{ borderSpacing: '0 4px' }}>
            <thead>
              <tr>
                <th className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 py-3 text-center">#</th>
                <th className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 py-3 text-left">Squadra</th>
                <th className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1 py-3 text-center">G</th>
                <th className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1 py-3 text-center">V</th>
                <th className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1 py-3 text-center">N</th>
                <th className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1 py-3 text-center">P</th>
                <th className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1 py-3 text-center">GF</th>
                <th className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1 py-3 text-center">GS</th>
                <th className="text-[0.65rem] font-semibold text-[var(--accent-primary)] uppercase tracking-wider px-2 py-3 text-center">PT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.07)]">
              {standings.map((row, i) => (
                <tr key={i} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-300">
                  <td className="px-2 py-3.5 text-center">
                    <span className={`text-[0.8rem] font-bold ${i < 3 ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </span>
                  </td>
                  <td className="px-2 py-3.5">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div className={`team-avatar avatar-${AVATAR_IDX[row.team_name] ?? 0}`} style={{ width: 26, height: 26, borderRadius: 7, fontSize: '0.55rem', flexShrink: 0 }}>
                        {AVATAR_INITIALS(row.team_name)}
                      </div>
                      <span className="text-[0.85rem] font-bold text-[var(--text-primary)]">{row.team_name}</span>
                    </div>
                  </td>
                  <td className="px-1 py-3.5 text-center text-sm text-[var(--text-secondary)]">{row.g}</td>
                  <td className="px-1 py-3.5 text-center text-sm text-[var(--text-secondary)]">{row.v}</td>
                  <td className="px-1 py-3.5 text-center text-sm text-[var(--text-secondary)]">{row.n}</td>
                  <td className="px-1 py-3.5 text-center text-sm text-[var(--text-secondary)]">{row.p}</td>
                  <td className="px-1 py-3.5 text-center text-sm text-[var(--text-secondary)]">{row.gf}</td>
                  <td className="px-1 py-3.5 text-center text-sm text-[var(--text-secondary)]">{row.gs}</td>
                  <td className="px-2 py-3.5 text-center"><span className="font-black text-white text-[0.95rem]">{row.pt}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Giocatori List */}
      {tab === 'giocatori' && (
        <div className="glass-card animate-stagger" style={{ marginTop: '1.5rem' }}>
          
          {/* Marcatori sub-tab */}
          {subTab === 'marcatori' && (
            scorers.length === 0 ? (
              <div className="text-center text-white/50 py-8">Nessun marcatore registrato.</div>
            ) : (
              scorers.map((s, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedPlayerId(s.player_id)}
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--glass-border)] last:border-b-0 hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-300 cursor-pointer"
                >
                  <div 
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shrink-0 border"
                    style={{
                      background: i === 0 ? 'rgba(245, 158, 11, 0.15)' : i === 1 ? 'rgba(148, 163, 184, 0.15)' : i === 2 ? 'rgba(180, 83, 9, 0.15)' : 'var(--glass-bg)',
                      borderColor: i === 0 ? 'rgba(245, 158, 11, 0.3)' : i === 1 ? 'rgba(148, 163, 184, 0.3)' : i === 2 ? 'rgba(180, 83, 9, 0.3)' : 'var(--glass-border)',
                      color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#fb923c' : 'var(--text-muted)'
                    }}
                  >
                    {i < 3 ? (i === 0 ? '🏅' : i === 1 ? '2' : '3') : i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-[0.9rem] font-bold text-[var(--text-primary)]">{s.player_name}</div>
                    <div className="text-[0.75rem] text-[var(--text-muted)]">{s.team_name}</div>
                  </div>
                  <div className="flex items-center gap-1.5 font-black text-lg text-[var(--accent-primary)]">
                    <span className="text-sm">⚽</span>
                    <span>{s.goals}</span>
                  </div>
                </div>
              ))
            )
          )}

          {/* Assistman sub-tab */}
          {subTab === 'assist' && (
            assists.length === 0 ? (
              <div className="text-center text-white/50 py-8">Nessun assist registrato.</div>
            ) : (
              assists.map((a, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedPlayerId(a.player_id)}
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--glass-border)] last:border-b-0 hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-300 cursor-pointer"
                >
                  <div 
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shrink-0 border"
                    style={{
                      background: i === 0 ? 'rgba(245, 158, 11, 0.15)' : i === 1 ? 'rgba(148, 163, 184, 0.15)' : i === 2 ? 'rgba(180, 83, 9, 0.15)' : 'var(--glass-bg)',
                      borderColor: i === 0 ? 'rgba(245, 158, 11, 0.3)' : i === 1 ? 'rgba(148, 163, 184, 0.3)' : i === 2 ? 'rgba(180, 83, 9, 0.3)' : 'var(--glass-border)',
                      color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#fb923c' : 'var(--text-muted)'
                    }}
                  >
                    {i < 3 ? (i === 0 ? '🏅' : i === 1 ? '2' : '3') : i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-[0.9rem] font-bold text-[var(--text-primary)]">{a.player_name}</div>
                    <div className="text-[0.75rem] text-[var(--text-muted)]">{a.team_name}</div>
                  </div>
                  <div className="flex items-center gap-1.5 font-black text-lg text-blue-400">
                    <span className="text-sm">🎯</span>
                    <span>{a.assists}</span>
                  </div>
                </div>
              ))
            )
          )}

          {/* Sanzioni sub-tab */}
          {subTab === 'sanzioni' && (
            cards.length === 0 ? (
              <div className="text-center text-white/50 py-8">Nessun cartellino estratto.</div>
            ) : (
              cards.map((c, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedPlayerId(c.player_id)}
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--glass-border)] last:border-b-0 hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-300 cursor-pointer"
                >
                  <div 
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shrink-0 border"
                    style={{
                      background: i === 0 ? 'rgba(245, 158, 11, 0.15)' : i === 1 ? 'rgba(148, 163, 184, 0.15)' : i === 2 ? 'rgba(180, 83, 9, 0.15)' : 'var(--glass-bg)',
                      borderColor: i === 0 ? 'rgba(245, 158, 11, 0.3)' : i === 1 ? 'rgba(148, 163, 184, 0.3)' : i === 2 ? 'rgba(180, 83, 9, 0.3)' : 'var(--glass-border)',
                      color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#fb923c' : 'var(--text-muted)'
                    }}
                  >
                    {i < 3 ? (i === 0 ? '🏅' : i === 1 ? '2' : '3') : i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-[0.9rem] font-bold text-[var(--text-primary)]">{c.player_name}</div>
                    <div className="text-[0.75rem] text-[var(--text-muted)]">{c.team_name}</div>
                  </div>
                  <div className="flex items-center gap-3 font-bold text-sm">
                    {c.yellow_cards > 0 && (
                      <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-2.5 py-1 text-yellow-400">
                        <div className="w-2.5 h-3.5 bg-yellow-400 rounded-[1px] rotate-6 shadow-[0_0_6px_rgba(250,204,21,0.4)]" />
                        <span>{c.yellow_cards}</span>
                      </div>
                    )}
                    {c.red_cards > 0 && (
                      <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 py-1 text-red-400">
                        <div className="w-2.5 h-3.5 bg-red-500 rounded-[1px] rotate-6 shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
                        <span>{c.red_cards}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      )}

      {/* Legend Modal */}
      {showLegend && (
        <div className="modal-overlay" onClick={() => setShowLegend(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-[400px] animate-[modalSlideUp_0.4s_var(--ease-spring)] px-4">
            <GlassEffect className="w-full rounded-[24px] p-6 md:p-8 relative overflow-hidden" style={{ display: 'block' }}>
              {/* Ambient background glows */}
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[rgba(59,130,246,0.35)] blur-[40px] pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[rgba(139,92,246,0.3)] blur-[40px] pointer-events-none" />

              <div className="relative">
                <div className="grid grid-cols-[32px_1fr_32px] gap-3 items-start mb-6 pt-1 px-1 md:px-3">
                  {/* Spacer to perfectly center the title */}
                  <div className="w-8 h-8 pointer-events-none"></div>

                  <div className="flex flex-col items-center justify-center">
                    <h3 className="text-xl font-extrabold tracking-tight text-white drop-shadow text-center">
                      Legenda Classifica
                    </h3>
                    <div className="h-[2px] w-12 mt-2 rounded bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] mx-auto" />
                  </div>

                  <button 
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-red-600/40 hover:from-red-500/40 hover:to-red-600/60 border border-red-500/30 text-red-100 transition-all duration-300 hover:rotate-90 active:scale-95 cursor-pointer outline-none shadow-[0_0_10px_rgba(239,68,68,0.2)] justify-self-end"
                    onClick={() => setShowLegend(false)}
                    aria-label="Chiudi"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {LEGEND.map((l, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-4 p-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.06)] transition-all duration-300"
                    >
                      <div 
                        className="w-10 h-8 flex items-center justify-center rounded-lg font-black text-xs border"
                        style={{
                          background: l.label === 'PT' 
                            ? 'rgba(59, 130, 246, 0.25)' 
                            : 'rgba(255, 255, 255, 0.08)',
                          borderColor: l.label === 'PT' 
                            ? 'rgba(59, 130, 246, 0.4)' 
                            : 'rgba(255, 255, 255, 0.15)',
                          color: '#ffffff'
                        }}
                      >
                        {l.label}
                      </div>
                      <span className="text-sm font-semibold text-white/90">
                        {l.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassEffect>
          </div>
        </div>
      )}
      {selectedPlayerId && (
        <PlayerStatsModal 
          playerId={selectedPlayerId} 
          onClose={() => setSelectedPlayerId(null)} 
        />
      )}
    </div>
  );
}
