import React, { useState, useEffect } from 'react';
import GlassEffect from './GlassEffect';
import { supabase } from '../lib/supabase';
import { getTeamLogo, parsePlayerName } from '../lib/teamUtils';

import PlayerStatsModal from './PlayerStatsModal';

const AVATAR_INITIALS = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const TEAM_IDX: Record<string, number> = {
  'Amatori Calcio Genova': 0,
  'Tama': 1,
  'Mario': 2,
  'Sezione 164': 3,
  'Gli Umili': 4,
  'Aston Birra': 5,
  'Taverna': 6,
  'UCG (Bairon)': 7,
  'U.C.G': 7,
  'Lo Dico FC': 8,
  'chainz': 9,
  'Chainz': 9,
  'FcPontos': 10,
  'Fc Pontos': 10,
};

const ROLE_ORDER: Record<string, number> = {
  'portiere': 1,
  'difensore': 2,
  'centrocampista': 3,
  'attaccante': 4,
};

const sortPlayersByRole = (list: any[]) => {
  return list.slice().sort((a, b) => {
    const roleA = a.role ? a.role.toLowerCase() : '';
    const roleB = b.role ? b.role.toLowerCase() : '';
    const rankA = ROLE_ORDER[roleA] ?? 5;
    const rankB = ROLE_ORDER[roleB] ?? 5;
    if (rankA !== rankB) return rankA - rankB;
    return a.name.localeCompare(b.name);
  });
};

export default function LiveMatchIsland() {
  const [liveMatch, setLiveMatch] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedCardDetail, setSelectedCardDetail] = useState<string | null>(null);

  const [matchId, setMatchId] = useState<string | null>(null);
  const [tab, setTab] = useState<'timeline' | 'lineups'>('timeline');
  const [homePlayers, setHomePlayers] = useState<any[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<any[]>([]);

  // Carica il matchId dai query parameters all'avvio
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMatchId(params.get('id'));
  }, []);

  // Effect 1: Caricamento iniziale dei dati (match, eventi, giocatori delle due rose)
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      
      let query = supabase
        .from('matches')
        .select('*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)');
      
      if (matchId) {
        query = query.eq('id', matchId);
      } else {
        query = query.eq('status', 'LIVE');
      }

      const { data: match, error: matchError } = await query.maybeSingle();

      if (!isMounted) return;

      if (matchError) {
        console.error('Error loading match:', matchError);
        setLoading(false);
        return;
      }

      if (match) {
        // Aggiorna cache locale 'cage-matches' se presente
        try {
          const lsStr = localStorage.getItem('cage-matches');
          if (lsStr) {
            const cached = JSON.parse(lsStr);
            if (cached && cached.data) {
              const idx = cached.data.findIndex((m: any) => m.id === match.id);
              if (idx !== -1) {
                cached.data[idx] = {
                  ...cached.data[idx],
                  status: match.status,
                  home_score: match.home_score,
                  away_score: match.away_score
                };
                localStorage.setItem('cage-matches', JSON.stringify(cached));
                const win = window as any;
                if (win.__cage_cache) {
                  win.__cage_cache['cage-matches'] = cached;
                }
              }
            }
          }
        } catch (e) {
          console.warn('Errore aggiornamento cache:', e);
        }

        // Fetch degli eventi per il match caricato
        const { data: evts, error: evtsError } = await supabase
          .from('match_events')
          .select('*, player:players!player_id(name, team_id)')
          .eq('match_id', match.id)
          .order('minute', { ascending: false });

        if (evtsError) {
          console.error('Error loading match events:', evtsError);
        }

        // Fetch dei giocatori di casa e trasferta per le formazioni
        const { data: hP } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', match.home_team_id)
          .order('name');

        const { data: aP } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', match.away_team_id)
          .order('name');

        if (!isMounted) return;

        setLiveMatch(match);
        if (evts) setEvents(evts);
        setHomePlayers(sortPlayersByRole(hP || []));
        setAwayPlayers(sortPlayersByRole(aP || []));
      } else {
        setLiveMatch(null);
        setEvents([]);
        setHomePlayers([]);
        setAwayPlayers([]);
      }
      setLoading(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [matchId]);

  // Effect 2: Gestione realtime per aggiornamenti di match ed eventi
  useEffect(() => {
    let isMounted = true;
    let channel: any = null;

    if (liveMatch?.id) {
      channel = supabase.channel(`live_match_${liveMatch.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${liveMatch.id}` },
          (payload) => {
            if (!isMounted) return;
            // Se non c'è matchId nella URL e il match smette di essere LIVE, lo togliamo dallo schermo
            if (payload.new && (payload.new as any).status !== 'LIVE' && !matchId) {
              setLiveMatch(null);
              setEvents([]);
            } else if (payload.new) {
              setLiveMatch(prev => ({ ...prev, ...payload.new }));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'match_events', filter: `match_id=eq.${liveMatch.id}` },
          async () => {
            if (!isMounted) return;
            const { data: evts } = await supabase
              .from('match_events')
              .select('*, player:players!player_id(name, team_id)')
              .eq('match_id', liveMatch.id)
              .order('minute', { ascending: false });
            
            if (isMounted && evts) setEvents(evts);
          }
        )
        .subscribe();
    } else if (!matchId && !loading) {
      // Rilevatore di match che diventano LIVE se siamo sulla diretta generica e non c'è live attivo
      channel = supabase.channel('live_match_detector')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'matches', filter: 'status=eq.LIVE' },
          () => {
            if (isMounted) {
              setLoading(true);
            }
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [liveMatch?.id, matchId, loading]);



  if (loading) return <div className="p-8 text-center text-white">Caricamento diretta...</div>;
  
  if (!liveMatch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
        <div className="text-4xl mb-4">📺</div>
        <h2 className="text-xl font-bold mb-2">Nessun dettaglio partita</h2>
        <p className="text-white/60 mb-6">Non ci sono match corrispondenti o in corso in questo momento.</p>
        <a href="/calendario" className="install-btn px-6 py-2">Torna al Calendario</a>
      </div>
    );
  }

  const homeName = liveMatch.home_team?.name || 'Home';
  const awayName = liveMatch.away_team?.name || 'Away';
  const homeScore = liveMatch.home_score || 0;
  const awayScore = liveMatch.away_score || 0;

  // Elaborazione statistiche in base agli eventi
  const playerGoals: Record<string, number> = {};
  const playerAutogoals: Record<string, number> = {};
  const playerYellows: Record<string, boolean> = {};
  const playerReds: Record<string, boolean> = {};

  events.forEach(ev => {
    if (ev.player_id) {
      const isGoal = ev.type === 'GOAL' || ev.type === 'Goal' || ev.type === 'Goal (Penalty)' || ev.type === 'Goal (Stella)' || ev.type === 'Goal (Raddoppiato)' || (ev.type === 'CARTA' && ev.detail && (ev.detail === 'starplayer' || ev.detail === 'goalx2' || ev.detail.endsWith('::success')));
      if (isGoal) {
        playerGoals[ev.player_id] = (playerGoals[ev.player_id] || 0) + 1;
      } else if (ev.type === 'AUTOGOAL' || ev.type === 'Autogoal') {
        playerAutogoals[ev.player_id] = (playerAutogoals[ev.player_id] || 0) + 1;
      } else if (ev.type === 'AMMONIZIONE' || ev.type === 'Yellow Card') {
        playerYellows[ev.player_id] = true;
      } else if (ev.type === 'ESPULSIONE' || ev.type === 'Red Card') {
        playerReds[ev.player_id] = true;
      }
    }
  });

  return (
    <div className="flex flex-col w-full text-white min-h-screen">
      {/* Header HUD Container */}
      <div 
        className="relative w-full overflow-hidden border-b border-white/10"
        style={{ 
          height: '280px', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* Deep Abstract Mesh Background */}
        <div 
          className="absolute inset-0 bg-[#0a0f1d]"
          style={{
            background: 'radial-gradient(circle at 50% -20%, #1a233d 0%, #0a0f1d 100%)'
          }}
        />

        {/* High-Tech Tactical Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.12] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
            backgroundPosition: 'center top',
            maskImage: 'linear-gradient(to bottom, black 20%, transparent 95%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 95%)'
          }}
        />

        {/* Morphing Fluid Ambient Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Home Team Red Glow (left side) */}
          <div 
            className="absolute top-[-15%] left-[-5%] w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-red-500/40 to-rose-600/15 blur-[90px] animate-glow-pulse-red"
            style={{ mixBlendMode: 'screen' }}
          />
          {/* Away Team Blue Glow (right side) */}
          <div 
            className="absolute top-[-15%] right-[-5%] w-[380px] h-[380px] rounded-full bg-gradient-to-tl from-blue-500/45 to-indigo-600/15 blur-[90px] animate-glow-pulse-blue"
            style={{ mixBlendMode: 'screen' }}
          />
          {/* Central Purple Transition Glow */}
          <div 
            className="absolute top-[10%] left-[25%] w-[420px] h-[280px] rounded-full bg-purple-500/25 blur-[100px] animate-[ambientGlowPulse_9s_ease-in-out_infinite_1.5s]"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
        
        {/* Vignette Overlay for smooth edges */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{
            background: 'linear-gradient(to bottom, rgba(10,15,29,0) 40%, rgba(10,15,29,0.6) 75%, var(--vignette-end) 98%)'
          }}
        />

        {/* Top Navbar */}
        <div className="absolute top-5 left-6 right-6 flex items-center justify-between z-30">
          <GlassEffect className="w-9 h-9 rounded-full hover:scale-105 active:scale-95 transition-all duration-300">
            <a 
              href="/calendario" 
              className="w-full h-full flex items-center justify-center text-white" 
              style={{ textDecoration: 'none' }}
              aria-label="Torna al calendario"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-4.5 h-4.5 text-white opacity-85 hover:opacity-100 transition-opacity -translate-x-[1px]"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </a>
          </GlassEffect>

          {/* Tournament Badge */}
          <span className="text-[0.6rem] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--glass-bg)] border border-[var(--glass-border)] px-3 py-1 rounded-full backdrop-blur-md">
            Memorial Gerry • {liveMatch.round}
          </span>

          <div className="w-9"></div> {/* Spacer */}
        </div>

        {/* Dashboard Content Container */}
        <div className="absolute inset-0 w-full h-full z-20 flex items-center justify-center pt-8 live-field-float">
          {/* Main Dashboard Panel */}
          <div className="flex items-center justify-between w-full max-w-[440px] px-6">
            {/* Home Team */}
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div className="relative group cursor-pointer">
                {/* Glowing neon ring backdrop */}
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-red-500 to-rose-600 opacity-45 blur-md group-hover:opacity-75 transition duration-500" />
                {(() => {
                  const logo = getTeamLogo(homeName);
                  return logo ? (
                    <img src={logo} alt={homeName} className="team-avatar object-cover !rounded-full w-16 h-16 border-2 border-red-500/40 avatar-glow-home" />
                  ) : (
                    <div className={`team-avatar avatar-${TEAM_IDX[homeName] ?? 0} !rounded-full w-16 h-16 border-2 border-red-500/40 text-lg font-black avatar-glow-home flex items-center justify-center`}>
                      {AVATAR_INITIALS(homeName)}
                    </div>
                  );
                })()}
              </div>
              <span 
                className="text-[0.75rem] font-black text-[var(--text-primary)] mt-3 select-none uppercase tracking-wider truncate w-full text-center"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}
              >
                {homeName}
              </span>
            </div>

            {/* Score & Status Center */}
            <div className="flex flex-col items-center justify-center px-4">
              {/* Status Indicator */}
              <div className="mb-3">
                {liveMatch.status === 'LIVE' ? (
                  <span className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/35 py-1 px-3 rounded-full animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    <span className="text-[0.6rem] font-black uppercase text-red-400 tracking-widest">Live</span>
                  </span>
                ) : liveMatch.status === 'TERMINATA' ? (
                  <span className="bg-[var(--glass-bg)] border border-[var(--glass-border)] py-1 px-3 rounded-full text-[var(--text-secondary)] text-[0.6rem] font-bold uppercase tracking-widest">
                    Terminata
                  </span>
                ) : (
                  <span className="bg-blue-500/10 border border-blue-500/25 py-1 px-3 rounded-full text-blue-400 text-[0.6rem] font-bold uppercase tracking-widest">
                    Prossima
                  </span>
                )}
              </div>

              {/* Glowing LED score */}
              <div 
                className="flex items-center gap-4 py-2.5 px-6 rounded-2xl border backdrop-blur-md shimmer-sweep-container"
                style={{
                  background: 'var(--score-bg)',
                  borderColor: 'rgba(139, 92, 246, 0.45)',
                  boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.15), 0 0 20px rgba(139, 92, 246, 0.25), 0 8px 32px rgba(0, 0, 0, 0.55)',
                }}
              >
                <span className="text-3xl font-black text-[var(--text-primary)] tabular-nums tracking-normal">{homeScore}</span>
                <span className="text-[var(--text-muted)] text-xl font-light">-</span>
                <span className="text-3xl font-black text-[var(--text-primary)] tabular-nums tracking-normal">{awayScore}</span>
              </div>

              {/* Time display / subtitle */}
              <span className="text-[0.65rem] font-semibold text-[var(--text-secondary)] mt-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] py-0.5 px-2 rounded">
                {liveMatch.status === 'LIVE' ? 'In corso...' : liveMatch.status === 'TERMINATA' ? 'Match Terminato' : 'In programmazione'}
              </span>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div className="relative group cursor-pointer">
                {/* Glowing neon ring backdrop */}
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 opacity-45 blur-md group-hover:opacity-75 transition duration-500" />
                {(() => {
                  const logo = getTeamLogo(awayName);
                  return logo ? (
                    <img src={logo} alt={awayName} className="team-avatar object-cover !rounded-full w-16 h-16 border-2 border-blue-500/40 avatar-glow-away" />
                  ) : (
                    <div className={`team-avatar avatar-${TEAM_IDX[awayName] ?? 1} !rounded-full w-16 h-16 border-2 border-blue-500/40 text-lg font-black avatar-glow-away flex items-center justify-center`}>
                      {AVATAR_INITIALS(awayName)}
                    </div>
                  );
                })()}
              </div>
              <span 
                className="text-[0.75rem] font-black text-[var(--text-primary)] mt-3 select-none uppercase tracking-wider truncate w-full text-center"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}
              >
                {awayName}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center w-full px-4 mt-6 z-10">
        <div className="flex justify-center gap-4 w-[90%] max-w-[320px]">
          {(['timeline', 'lineups'] as const).map((t) => {
            const label = t === 'timeline' ? 'Eventi' : 'Formazioni';
            const isActive = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 rounded-full font-bold text-[0.85rem] transition-all border duration-300 cursor-pointer outline-none backdrop-blur-md backdrop-saturate-[180%] ${
                  isActive
                    ? 'bg-[rgba(59,130,246,0.3)] text-white border-[rgba(59,130,246,0.5)] shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_4px_rgba(255,255,255,0.2)] scale-105'
                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Centering Wrapper for Tab Contents */}
      <div className="w-full flex justify-center px-4">
        <div className="w-[90%] md:w-full max-w-[500px]">
          {tab === 'timeline' && (
            <div className="relative flex-1 w-full pt-8 pb-56 animate-[slideUpFade_0.4s_var(--ease-apple)]">
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-20 pointer-events-none"></div>
              <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-gradient-to-b from-blue-500/40 via-purple-500/40 to-transparent -translate-x-1/2 shadow-[0_0_8px_rgba(139,92,246,0.3)]"></div>
              
              <div className="flex flex-col gap-8 relative z-10">
                {events.length === 0 ? (
                  <div className="text-center text-white/50 text-xs mt-8 py-8 border border-white/5 bg-black/15 rounded-2xl">
                    Nessun evento ancora registrato in questa partita.
                  </div>
                ) : null}
                {events.map((ev, i) => {
                  const isCard = ev.type === 'CARTA';
                  const isHome = ev.team_id === liveMatch.home_team_id;
                  const playerName = ev.player?.name || 'Sconosciuto';
                  const detailType = ev.detail;
                  const eventLabel = ev.type === 'GOAL' 
                    ? 'Gol' 
                    : ev.type === 'AUTOGOAL' 
                      ? 'Autogol' 
                      : ev.type === 'AMMONIZIONE' 
                        ? 'Ammonizione' 
                        : ev.type === 'ESPULSIONE' 
                          ? 'Espulsione' 
                          : ev.type === 'ASSIST' 
                            ? 'Assist' 
                            : ev.type;

                  return (
                    <div key={i} className="flex items-center w-full min-w-0">
                      <div className="flex-1 flex justify-end pr-3.5 min-w-0">
                        {isHome && (
                          isCard ? (
                            <div className="flex flex-col items-end gap-1 max-w-full">
                              <span onClick={() => ev.player_id && setSelectedPlayerId(ev.player_id)} className={`text-[0.6rem] font-black tracking-widest text-white/40 uppercase truncate w-full text-right ${ev.player_id ? 'cursor-pointer hover:text-blue-400 transition-colors' : ''}`}>
                                {playerName}
                              </span>
                              <div onClick={() => setSelectedCardDetail(detailType)} className="cursor-pointer hover:scale-105 transition-transform origin-right">
                                {renderEventMedia({ type: 'Carta Attivata', detail: detailType })}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5 text-right flex-row-reverse min-w-0">
                               <div className="flex-shrink-0">{renderEventMedia(ev)}</div>
                               <div className="flex flex-col min-w-0">
                                 <span onClick={() => ev.player_id && setSelectedPlayerId(ev.player_id)} className={`font-extrabold text-[0.8rem] md:text-[0.9rem] tracking-wide text-white drop-shadow-md uppercase leading-tight truncate ${ev.player_id ? 'cursor-pointer hover:text-blue-400 transition-colors' : ''}`}>
                                   {playerName}
                                 </span>
                                 <span className="text-[0.65rem] text-white/60 font-semibold mt-0.5 truncate">{eventLabel}</span>
                               </div>
                            </div>
                          )
                        )}
                      </div>
                      
                      <div className="flex-shrink-0 z-10 px-1.5">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[0.8rem] font-black backdrop-blur-md shadow-[0_0_12px_rgba(0,0,0,0.4)] border transition-all duration-300 ${
                           isHome 
                             ? 'border-red-500/40 bg-red-950/25 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.15)]' 
                             : 'border-blue-500/40 bg-blue-950/25 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.15)]'
                         }`}>
                           {ev.minute}'
                         </div>
                      </div>

                      <div className="flex-1 flex justify-start pl-3.5 min-w-0">
                        {!isHome && (
                          isCard ? (
                            <div className="flex flex-col items-start gap-1 max-w-full">
                              <span onClick={() => ev.player_id && setSelectedPlayerId(ev.player_id)} className={`text-[0.6rem] font-black tracking-widest text-white/40 uppercase truncate w-full text-left ${ev.player_id ? 'cursor-pointer hover:text-blue-400 transition-colors' : ''}`}>
                                {playerName}
                              </span>
                              <div onClick={() => setSelectedCardDetail(detailType)} className="cursor-pointer hover:scale-105 transition-transform origin-left">
                                {renderEventMedia({ type: 'Carta Attivata', detail: detailType })}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5 text-left min-w-0">
                               <div className="flex-shrink-0">{renderEventMedia(ev)}</div>
                               <div className="flex flex-col min-w-0">
                                 <span onClick={() => ev.player_id && setSelectedPlayerId(ev.player_id)} className={`font-extrabold text-[0.8rem] md:text-[0.9rem] tracking-wide text-white drop-shadow-md uppercase leading-tight truncate ${ev.player_id ? 'cursor-pointer hover:text-blue-400 transition-colors' : ''}`}>
                                   {playerName}
                                 </span>
                                 <span className="text-[0.65rem] text-white/60 font-semibold mt-0.5 truncate">{eventLabel}</span>
                               </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'lineups' && (
            <div className="w-full pt-8 pb-56 flex flex-col gap-6 animate-[slideUpFade_0.4s_var(--ease-apple)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  className="liquid-glass-stack-wrapper w-full h-full"
                  style={{
                    '--stack-border-color': 'rgba(239, 68, 68, 0.18)',
                    '--stack-glow-color': 'rgba(239, 68, 68, 0.03)',
                  } as React.CSSProperties}
                >
                  <GlassEffect 
                    className="rounded-2xl h-full w-full"
                    contentClassName="pt-6 px-5 pb-5 flex flex-col gap-3 w-full h-full"
                    style={{ 
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      '--hover-glow-start': 'rgba(239, 68, 68, 0.35)',
                      '--hover-glow-end': 'rgba(239, 68, 68, 0.05)',
                      '--card-inner-glow': 'inset 1.5px 1.5px 1.5px 0 rgba(239, 68, 68, 0.25), inset -1px -1px 1px 0 rgba(255, 255, 255, 0.04)'
                    } as React.CSSProperties}
                  >
                    <h3 className="text-xs font-black text-red-400 uppercase tracking-widest mb-3 border-b border-[var(--glass-border)] pb-2 text-center truncate">{homeName}</h3>
                    <div className="flex flex-col gap-2">
                      {homePlayers.length === 0 ? (
                        <div className="text-xs text-[var(--text-muted)] text-center py-4">Nessun Giocatore</div>
                      ) : (
                        homePlayers.map((p, idx) => {
                          const { displayName, isExtra } = parsePlayerName(p.name);
                          return (
                            <div 
                              key={p.id} 
                              className={`relative flex items-center bg-black/10 hover:bg-black/20 dark:hover:bg-white/5 border border-transparent hover:border-red-500/30 rounded-xl px-3.5 py-3 transition-all duration-300 group/player cursor-pointer ${
                                isExtra ? 'bg-amber-500/[0.02] border-t border-dashed border-amber-500/10' : ''
                              }`}
                              onClick={() => setSelectedPlayerId(p.id)}
                            >
                              <div className="flex-1 flex justify-start items-center text-[var(--text-muted)] font-mono text-[10px]">
                                {isExtra ? '★' : idx + 1}
                              </div>
                              <div className="flex-[2] flex flex-col justify-center items-center text-center min-w-0 px-2">
                                <span className="font-bold text-[var(--text-primary)] group-hover/player:text-red-400 transition-colors truncate">
                                  {displayName}
                                </span>
                                {p.role && (
                                  <span className="text-[9px] font-semibold text-white/50 capitalize mt-0.5">
                                    {p.role}
                                  </span>
                                )}
                                {isExtra && (
                                  <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider mt-0.5">
                                    Slot Extra
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 flex justify-end items-center gap-2 flex-shrink-0">
                                {playerGoals[p.id] && <span className="text-[10px] bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-black text-red-400">⚽ {playerGoals[p.id]}</span>}
                                {playerAutogoals[p.id] && <span className="text-[10px] bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-black text-red-400" title="Autogol">⚽ (AG) {playerAutogoals[p.id]}</span>}
                                {playerYellows[p.id] && <div className="w-2.5 h-3.5 rounded-[2px] bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.5)] rotate-12" />}
                                {playerReds[p.id] && <div className="w-2.5 h-3.5 rounded-[2px] bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.5)] rotate-12" />}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </GlassEffect>
                </div>

                <div 
                  className="liquid-glass-stack-wrapper w-full h-full"
                  style={{
                    '--stack-border-color': 'rgba(59, 130, 246, 0.18)',
                    '--stack-glow-color': 'rgba(59, 130, 246, 0.03)',
                  } as React.CSSProperties}
                >
                  <GlassEffect 
                    className="rounded-2xl h-full w-full"
                    contentClassName="pt-6 px-5 pb-5 flex flex-col gap-3 w-full h-full"
                    style={{ 
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      '--hover-glow-start': 'rgba(59, 130, 246, 0.35)',
                      '--hover-glow-end': 'rgba(59, 130, 246, 0.05)',
                      '--card-inner-glow': 'inset 1.5px 1.5px 1.5px 0 rgba(59, 130, 246, 0.25), inset -1px -1px 1px 0 rgba(255, 255, 255, 0.04)'
                    } as React.CSSProperties}
                  >
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3 border-b border-[var(--glass-border)] pb-2 text-center truncate">{awayName}</h3>
                    <div className="flex flex-col gap-2">
                      {awayPlayers.length === 0 ? (
                        <div className="text-xs text-[var(--text-muted)] text-center py-4">Nessun Giocatore</div>
                      ) : (
                        awayPlayers.map((p, idx) => {
                          const { displayName, isExtra } = parsePlayerName(p.name);
                          return (
                            <div 
                              key={p.id} 
                              className={`relative flex items-center bg-black/10 hover:bg-black/20 dark:hover:bg-white/5 border border-transparent hover:border-blue-500/30 rounded-xl px-3.5 py-3 transition-all duration-300 group/player cursor-pointer ${
                                isExtra ? 'bg-amber-500/[0.02] border-t border-dashed border-amber-500/10' : ''
                              }`}
                              onClick={() => setSelectedPlayerId(p.id)}
                            >
                              <div className="flex-1 flex justify-start items-center text-[var(--text-muted)] font-mono text-[10px]">
                                {isExtra ? '★' : idx + 1}
                              </div>
                              <div className="flex-[2] flex flex-col justify-center items-center text-center min-w-0 px-2">
                                <span className="font-bold text-[var(--text-primary)] group-hover/player:text-blue-400 transition-colors truncate">
                                  {displayName}
                                </span>
                                {p.role && (
                                  <span className="text-[9px] font-semibold text-white/50 capitalize mt-0.5">
                                    {p.role}
                                  </span>
                                )}
                                {isExtra && (
                                  <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider mt-0.5">
                                    Slot Extra
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 flex justify-end items-center gap-2 flex-shrink-0">
                                {playerGoals[p.id] && <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-black text-blue-400">⚽ {playerGoals[p.id]}</span>}
                                {playerAutogoals[p.id] && <span className="text-[10px] bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-black text-red-400" title="Autogol">⚽ (AG) {playerAutogoals[p.id]}</span>}
                                {playerYellows[p.id] && <div className="w-2.5 h-3.5 rounded-[2px] bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.5)] rotate-12" />}
                                {playerReds[p.id] && <div className="w-2.5 h-3.5 rounded-[2px] bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.5)] rotate-12" />}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </GlassEffect>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {selectedPlayerId && (
        <PlayerStatsModal 
          playerId={selectedPlayerId} 
          onClose={() => setSelectedPlayerId(null)} 
          themeColor={
            homePlayers.some(p => p.id === selectedPlayerId)
              ? 'home'
              : awayPlayers.some(p => p.id === selectedPlayerId)
                ? 'away'
                : 'neutral'
          }
        />
      )}

      {selectedCardDetail && (
        <CardInfoModal
          detail={selectedCardDetail}
          onClose={() => setSelectedCardDetail(null)}
        />
      )}
    </div>
  );
}

function CardInfoModal({ detail, onClose }: { detail: string, onClose: () => void }) {
  const [baseDetail, outcome] = detail.split('::');
  
  const cardInfo: Record<string, { title: string, desc: string, icon: string, color: string }> = {
    penalty: {
      title: 'Penalty',
      icon: '🎯',
      color: 'text-red-400',
      desc: 'Concede un calcio di rigore alla squadra che gioca la carta.'
    },
    shootout: {
      title: 'Shootout',
      icon: '⚡',
      color: 'text-amber-400',
      desc: 'Concede uno shootout (1 contro 1 col portiere partendo da centrocampo).'
    },
    suspension: {
      title: 'Suspension',
      icon: '⛔',
      color: 'text-gray-300',
      desc: 'Sospende un giocatore avversario per 3 minuti.'
    },
    goalx2: {
      title: 'Goal X2',
      icon: '🔥',
      color: 'text-pink-400',
      desc: 'Raddoppia il valore del prossimo goal segnato entro 3 minuti (se attivata).'
    },
    starplayer: {
      title: 'Star Player',
      icon: '🌟',
      color: 'text-purple-400',
      desc: 'Un giocatore diventa Star Player per 3 minuti: i suoi goal valgono doppio.'
    },
    joker: {
      title: 'Joker',
      icon: '🃏',
      color: 'text-blue-400',
      desc: 'Imprevisto! Può essere un effetto positivo o negativo a sorpresa per una delle due squadre.'
    }
  };

  const info = cardInfo[baseDetail] || {
    title: 'Carta Speciale',
    icon: '🃏',
    color: 'text-white',
    desc: 'Effetto speciale applicato alla partita.'
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-[320px] animate-[modalSlideUp_0.4s_var(--ease-spring)] px-4">
        <GlassEffect className="w-full p-6 relative overflow-hidden rounded-[24px]" style={{ display: 'block' }}>
          <button 
            className="absolute top-4 right-4 w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer outline-none z-10"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <div className="flex flex-col items-center text-center mt-2">
            <div className={`text-4xl mb-3 ${info.color} drop-shadow-md`}>{info.icon}</div>
            <h3 className={`text-xl font-black uppercase tracking-wider mb-2 ${info.color}`}>{info.title}</h3>
            <p className="text-sm text-white/80 leading-relaxed mb-4">{info.desc}</p>
            
            {(baseDetail === 'penalty' || baseDetail === 'shootout' || baseDetail === 'suspension') && (
              <div className="w-full bg-black/20 rounded-xl p-3 border border-white/5 flex flex-col gap-2 mt-2">
                <div className="flex items-start gap-2 text-xs">
                  <span className="font-black text-green-400 mt-0.5">✓</span>
                  <span className="text-white/70 text-left leading-tight"><strong className="text-white">Riuscito:</strong> l'effetto della carta ha avuto successo (es. goal segnato).</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span className="font-black text-red-400 mt-0.5">✗</span>
                  <span className="text-white/70 text-left leading-tight"><strong className="text-white">Fallito:</strong> l'effetto è fallito (es. goal sbagliato o parato).</span>
                </div>
              </div>
            )}
            
            {(outcome === 'success' || outcome === 'fail') && (
              <div className={`mt-4 w-full py-2 rounded-lg font-black uppercase tracking-widest text-xs border ${outcome === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                Esito: {outcome === 'success' ? 'Riuscito ✓' : 'Fallito ✗'}
              </div>
            )}
          </div>
        </GlassEffect>
      </div>
    </div>
  );
}

function renderEventMedia(ev: any) {
  switch (ev.type) {
    case 'GOAL':
    case 'Goal':
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-[var(--glass-border)] shadow-[0_0_8px_rgba(255,255,255,0.05)]">
          <span className="text-sm">⚽</span>
        </div>
      );
    case 'AUTOGOAL':
    case 'Autogoal':
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]">
          <span className="text-sm">⚽</span>
        </div>
      );
    case 'Goal (Penalty)':
    case 'Goal (Stella)':
    case 'Goal (Raddoppiato)':
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
          <span className="text-sm">⚽</span>
        </div>
      );
    case 'AMMONIZIONE':
    case 'Yellow Card':
      return (
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="w-3.5 h-5 rounded-[2px] bg-yellow-400 border border-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.5)] rotate-12 transform-gpu" />
        </div>
      );
    case 'ESPULSIONE':
    case 'Red Card':
      return (
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="w-3.5 h-5 rounded-[2px] bg-red-600 border border-red-500 shadow-[0_0_8px_rgba(220,38,38,0.5)] rotate-12 transform-gpu" />
        </div>
      );
    case 'Injured':
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20">
          <span className="text-xs">🚑</span>
        </div>
      );
    case 'Carta Attivata': {
      const [baseDetail, outcome] = (ev.detail || '').split('::');
      const cardGlows: Record<string, string> = {
        penalty: 'shadow-[0_0_12px_rgba(239,68,68,0.35)] border-red-500/30',
        shootout: 'shadow-[0_0_12px_rgba(245,158,11,0.35)] border-amber-500/30',
        suspension: 'shadow-[0_0_12px_rgba(107,114,128,0.3)] border-gray-400/30',
        goalx2: 'shadow-[0_0_12px_rgba(236,72,153,0.35)] border-pink-500/30',
        starplayer: 'shadow-[0_0_12px_rgba(168,85,247,0.35)] border-purple-500/30',
        joker: 'shadow-[0_0_12px_rgba(59,130,246,0.35)] border-blue-500/30',
      };
      
      const cardNames: Record<string, string> = {
        penalty: 'Penalty 🎯',
        shootout: 'Shootout ⚡',
        suspension: 'Suspension ⛔',
        goalx2: 'Goal X2 🔥',
        starplayer: 'Star Player 🌟',
        joker: 'Joker 🃏',
      };

      const glowClass = cardGlows[baseDetail] || 'shadow-[0_0_8px_rgba(255,255,255,0.15)] border-[rgba(255,255,255,0.06)]';
      const cardName = cardNames[baseDetail] || 'Carta Speciale';
      
      return (
        <div className="relative group">
          <div className="absolute -inset-0.5 rounded-[6px] bg-gradient-to-r from-blue-500 to-purple-500 opacity-15 blur-sm group-hover:opacity-30 transition duration-500 pointer-events-none" />
          
          <div className={`relative flex items-center gap-2 bg-[rgba(10,15,30,0.35)] border border-[rgba(255,255,255,0.06)] rounded-[8px] p-1 pr-2.5 ${glowClass}`}>
            <img 
              src={`/cards/${baseDetail}.webp`} 
              alt={cardName} 
              className="w-7 h-10 rounded-[3px] object-cover shadow-[0_2px_6px_rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.06)]"
            />
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[0.55rem] font-bold text-white/40 uppercase tracking-widest leading-none">Carta Giocata</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[0.65rem] font-black text-white uppercase tracking-wide truncate">{cardName}</span>
                {outcome === 'success' && <span className="text-xs" title="Gol segnato">✅</span>}
                {outcome === 'fail' && <span className="text-xs" title="Gol mancato">❌</span>}
              </div>
            </div>
          </div>
        </div>
      );
    }
    default:
      return <span className="text-white">•</span>;
  }
}
