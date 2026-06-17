import { useState, useEffect } from 'react';
import GlassEffect from './GlassEffect';
import { supabase } from '../lib/supabase';
import { getTeamLogo } from '../lib/teamUtils';


const AVATAR_INITIALS = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const TEAM_IDX: Record<string, number> = {
  'Amatori Calcio Genova': 0,
  'FC Ceres': 1,
  'FC Murta': 2,
  'Sezione 164': 3,
  'Gli Umili': 4,
  'Aston Birra': 5,
  'Taverna': 6,
  'UCG': 7,
  'Lo Dico FC': 8,
  'Chainz': 9,
  'FC Pontos': 10,
  'Gilly Boys': 11,
  'Pontex Pirates': 12,
  'San Teodoro Ketzmaja': 13,
};

import { fetchWithCache } from '../lib/cache';

const sortMatches = (list: any[]) => list.slice().sort((a, b) => {
  const aLive = a.status === 'LIVE' ? 0 : 1;
  const bLive = b.status === 'LIVE' ? 0 : 1;
  if (aLive !== bLive) return aLive - bLive; // LIVE sempre prima
  return new Date(a.match_date).getTime() - new Date(b.match_date).getTime();
});

import { useMemo } from 'react';

export default function CalendarioIsland() {
  const [tab, setTab] = useState<'calendario' | 'tabellone'>('calendario');
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('all');

  const availableDays = useMemo(() => {
    const days = new Set(matches.map(m => new Date(m.match_date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })));
    return Array.from(days);
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (selectedDay === 'all') return matches;
    return matches.filter(m => {
      const matchDay = new Date(m.match_date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
      return matchDay === selectedDay;
    });
  }, [matches, selectedDay]);

  const findMatchByRound = (roundKey: string) => {
    return matches.find(m => {
      const r = m.round ? m.round.toLowerCase() : '';
      if (roundKey === 'QF1') return r === 'qf1' || (r.includes('quarti') && (r.includes('1') || r.includes('uno')));
      if (roundKey === 'QF2') return r === 'qf2' || (r.includes('quarti') && (r.includes('2') || r.includes('due')));
      if (roundKey === 'QF3') return r === 'qf3' || (r.includes('quarti') && (r.includes('3') || r.includes('tre')));
      if (roundKey === 'QF4') return r === 'qf4' || (r.includes('quarti') && (r.includes('4') || r.includes('quattro')));
      if (roundKey === 'SF1') return r === 'sf1' || (r.includes('semifinale') && (r.includes('1') || r.includes('uno')));
      if (roundKey === 'SF2') return r === 'sf2' || (r.includes('semifinale') && (r.includes('2') || r.includes('due')));
      if (roundKey === 'Finale') return r === 'finale' && !r.includes('semi') && !r.includes('quarti');
      return false;
    });
  };

  const renderBracketCard = (roundLabel: string, defaultTeam1: string, defaultTeam2: string, defaultTime: string, roundKey: string, isGold = false) => {
    const match = findMatchByRound(roundKey);
    const homeName = match?.home_team?.name;
    const awayName = match?.away_team?.name;
    const homeScore = match?.home_score;
    const awayScore = match?.away_score;
    
    const t1Name = homeName || defaultTeam1;
    const t2Name = awayName || defaultTeam2;
    
    const timeStr = match
      ? new Date(match.match_date).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : defaultTime;

    const isLive = match?.status === 'LIVE';
    const isTerminata = match?.status === 'TERMINATA';

    const t1Initials = homeName ? AVATAR_INITIALS(homeName) : defaultTeam1.substring(0, 2).toUpperCase();
    const t2Initials = awayName ? AVATAR_INITIALS(awayName) : defaultTeam2.substring(0, 2).toUpperCase();

    const t1Idx = homeName ? (TEAM_IDX[homeName] ?? 0) : 10;
    const t2Idx = awayName ? (TEAM_IDX[awayName] ?? 1) : 11;

    const homeWon = isTerminata && homeScore !== null && awayScore !== null && homeScore > awayScore;
    const awayWon = isTerminata && homeScore !== null && awayScore !== null && awayScore > homeScore;

    const cardContent = (
      <>
        {/* Team 1 */}
        <div className={`bracket-team ${homeWon ? 'bracket-team-winner' : isTerminata && awayScore !== null ? 'opacity-50' : ''}`}>
          {(() => {
            const logo = getTeamLogo(t1Name);
            return logo ? (
              <img src={logo} alt={t1Name} className="team-avatar object-cover" style={{ width: isGold ? 28 : 26, height: isGold ? 28 : 26, borderRadius: isGold ? 8 : 6 }} />
            ) : (
              <div className={`team-avatar avatar-${t1Idx}`} style={{ width: isGold ? 28 : 26, height: isGold ? 28 : 26, borderRadius: isGold ? 8 : 6, fontSize: '0.55rem', fontWeight: 800 }}>
                {t1Initials}
              </div>
            );
          })()}
          <span className={`bracket-team-name ${isGold ? 'font-black' : ''}`}>
            {t1Name}
          </span>
          {isTerminata && homeScore !== null && (
            <span className="bracket-team-score ml-auto font-bold">{homeScore}</span>
          )}
        </div>
        
        <div className="bracket-divider" />
        
        {/* Team 2 */}
        <div className={`bracket-team ${awayWon ? 'bracket-team-winner' : isTerminata && homeScore !== null ? 'opacity-50' : ''}`}>
          {(() => {
            const logo = getTeamLogo(t2Name);
            return logo ? (
              <img src={logo} alt={t2Name} className="team-avatar object-cover" style={{ width: isGold ? 28 : 26, height: isGold ? 28 : 26, borderRadius: isGold ? 8 : 6 }} />
            ) : (
              <div className={`team-avatar avatar-${t2Idx}`} style={{ width: isGold ? 28 : 26, height: isGold ? 28 : 26, borderRadius: isGold ? 8 : 6, fontSize: '0.55rem', fontWeight: 800 }}>
                {t2Initials}
              </div>
            );
          })()}
          <span className={`bracket-team-name ${isGold ? 'font-black' : ''}`}>
            {t2Name}
          </span>
          {isTerminata && awayScore !== null && (
            <span className="bracket-team-score ml-auto font-bold">{awayScore}</span>
          )}
        </div>
        
        <div className={`bracket-time ${isGold ? 'final-time' : ''} ${isLive ? 'text-red-400 font-bold animate-pulse' : ''}`}>
          {isLive ? 'IN DIRETTA' : timeStr}
        </div>
      </>
    );

    return (
      <div className={`bracket-card-wrapper ${isGold ? 'final-wrapper' : ''}`}>
        <div className={`bracket-round-title ${isGold ? 'final-title' : ''}`}>
          {isLive && <span className="text-red-500 mr-1 animate-pulse">🔴</span>}
          {roundLabel}
        </div>
        {match ? (
          <a 
            href={`/live?id=${match.id}`}
            className={`glass-card bracket-card ${isGold ? 'final-card-gold' : ''} ${isLive ? 'bracket-card-live' : ''}`}
            style={{ display: 'block', textDecoration: 'none', cursor: 'pointer' }}
          >
            {cardContent}
          </a>
        ) : (
          <div className={`glass-card bracket-card ${isGold ? 'final-card-gold' : ''}`}>
            {cardContent}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    let isMounted = true;

    async function loadMatches(force = false) {
      const fetchFn = async () => {
        const { data } = await supabase
          .from('matches')
          .select(`
            id, match_date, round, status, home_score, away_score,
            home_team:teams!home_team_id ( name ),
            away_team:teams!away_team_id ( name )
          `)
          .order('match_date', { ascending: true });
        return data || [];
      };

      // Ordinamento gestito tramite la funzione globale sortMatches

      if (force) {
        try {
          const freshData = await fetchFn();
          if (isMounted) {
            setMatches(sortMatches(freshData));
            // Aggiorna cache locale
            const win = window as any;
            if (!win.__cage_cache) win.__cage_cache = {};
            win.__cage_cache['cage-matches'] = { data: freshData, timestamp: Date.now() };
            localStorage.setItem('cage-matches', JSON.stringify({ data: freshData, timestamp: Date.now() }));
          }
        } catch (e) {
          console.error(e);
        }
        return;
      }

      const cachedData = await fetchWithCache(
        'cage-matches',
        fetchFn,
        (newData) => {
        if (isMounted) setMatches(sortMatches(newData));
        }
      );

      if (isMounted && cachedData) {
        setMatches(sortMatches(cachedData));
      }
    }
    
    loadMatches();

    // Sottoscrizione realtime per le partite (fetch diretto come in HomeIsland)
    const channel = supabase.channel('calendario_realtime_matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, async (payload: any) => {
        console.log('Realtime match update received in Calendario:', payload);
        try {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = payload.new;
            setMatches(prevMatches => {
              const updatedList = prevMatches.map(m => {
                if (m.id === updated.id) {
                  return {
                    ...m,
                    status: updated.status,
                    home_score: updated.home_score,
                    away_score: updated.away_score,
                    match_date: updated.match_date,
                    round: updated.round,
                    home_team_id: updated.home_team_id,
                    away_team_id: updated.away_team_id
                  };
                }
                return m;
              });
              
              const sorted = sortMatches(updatedList);
              
              // Aggiorna la cache locale istantaneamente
              const win = window as any;
              if (!win.__cage_cache) win.__cage_cache = {};
              win.__cage_cache['cage-matches'] = { data: sorted, timestamp: Date.now() };
              localStorage.setItem('cage-matches', JSON.stringify({ data: sorted, timestamp: Date.now() }));
              
              return sorted;
            });
          } else {
            // Per INSERT o DELETE, facciamo un fetch fresco completo
            const { data } = await supabase
              .from('matches')
              .select(`
                id, match_date, round, status, home_score, away_score,
                home_team:teams!home_team_id ( name ),
                away_team:teams!away_team_id ( name )
              `)
              .order('match_date', { ascending: true });
            if (isMounted && data) {
              const sorted = sortMatches(data);
              setMatches(sorted);
              const win = window as any;
              if (!win.__cage_cache) win.__cage_cache = {};
              win.__cage_cache['cage-matches'] = { data: sorted, timestamp: Date.now() };
              localStorage.setItem('cage-matches', JSON.stringify({ data: sorted, timestamp: Date.now() }));
            }
          }
        } catch (e) {
          console.error('Errore nel caricamento realtime in Calendario:', e);
        }
      })
      .subscribe((status) => {
        console.log('Realtime channel subscription status in Calendario:', status);
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="w-full">
      {/* Chips Toggle */}
      <div className="flex justify-center w-full mt-6 sticky top-[85px] md:top-8 z-[120] px-4 transition-all duration-300" style={{ marginBottom: '40px' }}>
        <div className="flex justify-center gap-3 w-full max-w-[360px]">
          <button
            onClick={() => setTab('calendario')}
            className={`flex-1 py-3 rounded-full font-bold text-[1rem] transition-all border duration-300 cursor-pointer outline-none backdrop-blur-md backdrop-saturate-[180%] ${
              tab === 'calendario'
                ? 'bg-[rgba(59,130,246,0.3)] text-white border-[rgba(59,130,246,0.5)] shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_4px_rgba(255,255,255,0.2)] scale-105'
                : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
            }`}
          >
            Calendario
          </button>
          <button
            onClick={() => setTab('tabellone')}
            className={`flex-1 py-3 rounded-full font-bold text-[1rem] transition-all border duration-300 cursor-pointer outline-none backdrop-blur-md backdrop-saturate-[180%] ${
              tab === 'tabellone'
                ? 'bg-[rgba(59,130,246,0.3)] text-white border-[rgba(59,130,246,0.5)] shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_4px_rgba(255,255,255,0.2)] scale-105'
                : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
            }`}
          >
            Tabellone
          </button>
        </div>
      </div>

      {/* Day Filter */}
      {tab === 'calendario' && availableDays.length > 0 && (
        <div className="flex w-full overflow-x-auto pb-4 px-4 mb-2 gap-2 snap-x scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => setSelectedDay('all')}
            className={`snap-center shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all border outline-none ${
              selectedDay === 'all'
                ? 'bg-[rgba(59,130,246,0.3)] text-white border-[rgba(59,130,246,0.5)] shadow-[0_2px_8px_rgba(59,130,246,0.3)] scale-105'
                : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
            }`}
          >
            Tutte
          </button>
          {availableDays.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`snap-center shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all border outline-none capitalize ${
                selectedDay === day
                  ? 'bg-[rgba(59,130,246,0.3)] text-white border-[rgba(59,130,246,0.5)] shadow-[0_2px_8px_rgba(59,130,246,0.3)] scale-105'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {/* Calendario Matches List */}
      {tab === 'calendario' && (
        <div className="animate-stagger px-4 pb-4">
          {filteredMatches.map((m, i) => {
            const homeName = m.home_team?.name ?? 'N/D';
            const awayName = m.away_team?.name ?? 'N/D';
            const scoreStr = (m.home_score !== null && m.away_score !== null && m.status !== 'PROSSIMA') ? `${m.home_score} - ${m.away_score}` : null;
            const formattedDate = new Date(m.match_date).toLocaleString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            
            const isLive = m.status === 'LIVE';

            // Contenuto della card (uguale per live e non-live)
            const cardContent = (
              <>
                <div className="flex flex-col items-center gap-2 mb-7">
                  <span className={`text-xs font-semibold tracking-wide ${isLive ? 'text-red-400 font-bold' : 'text-[var(--text-muted)]'}`}>
                    {isLive ? '🔴 IN DIRETTA' : `📅 ${formattedDate}`}
                  </span>
                  <div className="flex gap-1.5 items-center justify-center">
                    <span className="badge badge-round">{m.round}</span>
                    <span className={`badge ${m.status === 'TERMINATA' ? 'badge-done' : isLive ? 'badge-live' : 'badge-next'}`}>
                      {m.status === 'TERMINATA' ? '✓' : '⚡'} {m.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  {/* Home */}
                  <div className="flex items-center gap-2 flex-1 justify-end flex-row-reverse text-right">
                    {(() => {
                      const logo = getTeamLogo(homeName);
                      return logo ? (
                        <img src={logo} alt={homeName} className="team-avatar object-cover" style={{ width: 34, height: 34, borderRadius: 10 }} />
                      ) : (
                        <div className={`team-avatar avatar-${TEAM_IDX[homeName] ?? 0}`} style={{ width: 34, height: 34, borderRadius: 10 }}>
                          {AVATAR_INITIALS(homeName)}
                        </div>
                      );
                    })()}
                    <span className="text-[0.875rem] font-bold text-[var(--text-primary)] leading-tight">{homeName}</span>
                  </div>

                  {/* Score / VS */}
                  {scoreStr ? (
                    <div className="bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] rounded-[12px] py-1.5 px-3.5 text-lg font-black text-white tracking-widest min-w-[76px] text-center shadow-[var(--inner-glow)]">
                      {scoreStr}
                    </div>
                  ) : (
                    <div className="bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] rounded-[12px] py-1.5 px-4 text-sm font-bold text-[var(--accent-primary)] tracking-widest min-w-[76px] text-center shadow-[var(--inner-glow)]">
                      VS
                    </div>
                  )}

                  {/* Away */}
                  <div className="flex items-center gap-2 flex-1 text-left">
                    {(() => {
                      const logo = getTeamLogo(awayName);
                      return logo ? (
                        <img src={logo} alt={awayName} className="team-avatar object-cover" style={{ width: 34, height: 34, borderRadius: 10 }} />
                      ) : (
                        <div className={`team-avatar avatar-${TEAM_IDX[awayName] ?? 1}`} style={{ width: 34, height: 34, borderRadius: 10 }}>
                          {AVATAR_INITIALS(awayName)}
                        </div>
                      );
                    })()}
                    <span className="text-[0.875rem] font-bold text-[var(--text-primary)] leading-tight">{awayName}</span>
                  </div>
                </div>
              </>
            );

            // Per le partite LIVE: glass-card con bordo rosso pulsante e senza backdrop-filter
            if (isLive) {
              return (
                <div
                  key={i}
                  className="relative pointer-events-auto rounded-[20px] group transition-all duration-700"
                  style={{ marginBottom: '1rem' }}
                >
                  <a
                    href={`/live?id=${m.id}`}
                    className="glass-card menu-glow-pulse-red"
                    style={{
                      display: 'block',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      padding: '1.2rem 1.25rem',
                      border: '1px solid transparent', // Keep transparent border to prevent layout shifts
                    }}
                  >
                    {/* Flowing red border layer */}
                    <div className="live-flowing-border" />
                    {cardContent}
                  </a>
                </div>
              );
            }

            return (
              <a
                key={i}
                href={`/live?id=${m.id}`}
                className="glass-card"
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                  padding: '1.2rem 1.25rem'
                }}
              >
                {cardContent}
              </a>
            );
          })}
        </div>
      )}

      {/* Knockout Bracket View */}
      {tab === 'tabellone' && (
        <div className="bracket-scroll-wrapper">
          <div className="bracket-container animate-stagger" style={{ marginTop: '2rem' }}>
            {/* Row 1: Quarti di Finale */}
            <div className="bracket-row">
              {renderBracketCard("Quarti 1", "1° Girone A", "4° Girone B", "28 mag, 20:00", "QF1")}
              {renderBracketCard("Quarti 2", "2° Girone B", "3° Girone A", "28 mag, 20:30", "QF2")}
              {renderBracketCard("Quarti 3", "1° Girone B", "4° Girone A", "28 mag, 21:00", "QF3")}
              {renderBracketCard("Quarti 4", "2° Girone A", "3° Girone B", "28 mag, 21:30", "QF4")}
            </div>

            {/* SVG Connector Lines (Quarti -> Semifinali) */}
            <div className="bracket-connector-container">
              <svg className="bracket-svg" viewBox="0 0 100 50" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Paths */}
                <path d="M 12.5 0 V 25 H 25 V 50" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
                <path d="M 37.5 0 V 25 H 25 V 50" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
                <path d="M 62.5 0 V 25 H 75 V 50" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
                <path d="M 87.5 0 V 25 H 75 V 50" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
                
                {/* Active Glows */}
                <path d="M 12.5 0 V 25 H 25 V 50" stroke="url(#active-glow-left)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                <path d="M 37.5 0 V 25 H 25 V 50" stroke="url(#active-glow-left)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                <path d="M 62.5 0 V 25 H 75 V 50" stroke="url(#active-glow-right)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                <path d="M 87.5 0 V 25 H 75 V 50" stroke="url(#active-glow-right)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                
                <defs>
                  <linearGradient id="active-glow-left" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="active-glow-right" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent-secondary)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Row 2: Semifinali */}
            <div className="bracket-row">
              {renderBracketCard("Semifinale 1", "Vincitore Quarti 1", "Vincitore Quarti 2", "30 mag, 21:00", "SF1")}
              {renderBracketCard("Semifinale 2", "Vincitore Quarti 3", "Vincitore Quarti 4", "30 mag, 21:00", "SF2")}
            </div>

            {/* SVG Connector Lines (Semifinali -> Finale) */}
            <div className="bracket-connector-container">
              <svg className="bracket-svg" viewBox="0 0 100 50" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 25 0 V 25 H 50 V 50" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
                <path d="M 75 0 V 25 H 50 V 50" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
                <path d="M 25 0 V 25 H 50 V 50" stroke="url(#active-glow-left)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                <path d="M 75 0 V 25 H 50 V 50" stroke="url(#active-glow-right)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
              </svg>
            </div>

            {/* Row 3: Finale */}
            <div className="bracket-row-center">
              {renderBracketCard("🏆 FINALE 🏆", "Vincitore SF1", "Vincitore SF2", "30 mag, 22:00", "Finale", true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
