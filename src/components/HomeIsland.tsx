import { useState, useEffect } from 'react';
import GlassEffect from './GlassEffect';
import { supabase } from '../lib/supabase';
import { fetchWithCache } from '../lib/cache';
import PlayerStatsModal from './PlayerStatsModal';
import { getTeamLogo, parsePlayerName } from '../lib/teamUtils';

const ROLE_ORDER: Record<string, number> = {
  'portiere': 1,
  'difensore': 2,
  'centrocampista': 3,
  'attaccante': 4
};

export const getRoleBadge = (role: string) => {
  if (!role) return null;
  const normalized = role.toLowerCase();
  
  let config = {
    label: 'Giocatore',
    icon: '🏃',
    bg: 'bg-white/5',
    text: 'text-white/60',
    border: 'border-white/10'
  };
  
  if (normalized === 'portiere') {
    config = {
      label: 'Portiere',
      icon: '🧤',
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      border: 'border-orange-500/20'
    };
  } else if (normalized === 'difensore') {
    config = {
      label: 'Difensore',
      icon: '🛡️',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20'
    };
  } else if (normalized === 'centrocampista') {
    config = {
      label: 'Centrocampista',
      icon: '🪄',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/20'
    };
  } else if (normalized === 'attaccante') {
    config = {
      label: 'Attaccante',
      icon: '🎯',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20'
    };
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border shadow-sm ${config.bg} ${config.text} ${config.border}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

const AVATAR_INITIALS = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const AVATAR_IDX: Record<string, number> = {
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

export default function HomeIsland() {
  const [tab, setTab] = useState<'squadre' | 'giocatori'>('squadre');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [playersAll, setPlayersAll] = useState<any[]>([]);
  
  // Dashboard states
  const [standings, setStandings] = useState<any[]>([]);
  const [featuredMatch, setFeaturedMatch] = useState<any>(null); // { type: 'LIVE'|'UPCOMING'|'LAST', match: any }
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // 1. Fetch teams & players
      const teamsWithPlayers = await fetchWithCache(
        'cage-teams-with-players',
        async () => {
          const { data } = await supabase
            .from('teams')
            .select('id, name, players(id, name, role)')
            .order('name');
          return data || [];
        },
        (newData) => {
          if (isMounted) updateTeamsUI(newData);
        }
      );

      if (isMounted && teamsWithPlayers) {
        updateTeamsUI(teamsWithPlayers);
      }

      // 2. Fetch standings for preview (limit 3)
      const standingsPromise = fetchWithCache(
        'cage-standings',
        async () => {
          const { data } = await supabase.from('standings').select('*');
          return data || [];
        },
        (newData) => {
          if (isMounted) setStandings(newData.slice(0, 3));
        }
      );

      // 3. Fetch matches to determine featured match
      const matchesPromise = fetchWithCache(
        'cage-matches',
        async () => {
          const { data } = await supabase
            .from('matches')
            .select(`
              id, match_date, round, status, home_score, away_score,
              home_team:teams!home_team_id ( name ),
              away_team:teams!away_team_id ( name )
            `)
            .order('match_date', { ascending: true });
          return data || [];
        },
        (newData) => {
          if (isMounted) setFeaturedMatch(processMatches(newData));
        }
      );

      const [cachedStandings, cachedMatches] = await Promise.all([standingsPromise, matchesPromise]);
      if (isMounted) {
        if (cachedStandings) setStandings(cachedStandings.slice(0, 3));
        if (cachedMatches) setFeaturedMatch(processMatches(cachedMatches));
      }
    }

    const processMatches = (list: any[]) => {
      const live = list.find(m => m.status === 'LIVE');
      if (live) return { type: 'LIVE', match: live };

      const upcoming = list.find(m => m.status === 'PROSSIMA');
      if (upcoming) return { type: 'UPCOMING', match: upcoming };

      const terminati = list.filter(m => m.status === 'TERMINATA');
      if (terminati.length > 0) {
        return { type: 'LAST', match: terminati[terminati.length - 1] };
      }

      return null;
    };

    const updateTeamsUI = (tData: any[] | null) => {
      if (!tData || tData.length === 0) return;

      const processedTeams = tData.map((t, i) => {
        const sortedPlayers = [...(t.players || [])].sort((a: any, b: any) => {
          const orderA = ROLE_ORDER[a.role?.toLowerCase() || ''] || 5;
          const orderB = ROLE_ORDER[b.role?.toLowerCase() || ''] || 5;
          if (orderA !== orderB) return orderA - orderB;
          return a.name.localeCompare(b.name);
        });
        
        return {
          name: t.name,
          idx: AVATAR_IDX[t.name] ?? i,
          players: sortedPlayers.map(p => ({ id: p.id, name: p.name, role: p.role }))
        };
      });
      setTeams(processedTeams);

      const allP = processedTeams.flatMap((t) =>
        t.players.map((p) => ({ id: p.id, name: p.name, role: p.role, team: t.name, idx: t.idx }))
      );
      setPlayersAll(allP);
    };

    loadData();

    // Sottoscrizioni Realtime per aggiornare i widget della Home in tempo reale
    const matchesChannel = supabase.channel('home_matches_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, async () => {
        const { data } = await supabase
          .from('matches')
          .select(`
            id, match_date, round, status, home_score, away_score,
            home_team:teams!home_team_id ( name ),
            away_team:teams!away_team_id ( name )
          `)
          .order('match_date', { ascending: true });
        if (isMounted && data) {
          setFeaturedMatch(processMatches(data));
          
          // Mantieni la cache globale allineata in tempo reale
          const win = window as any;
          if (!win.__cage_cache) win.__cage_cache = {};
          win.__cage_cache['cage-matches'] = { data, timestamp: Date.now() };
          localStorage.setItem('cage-matches', JSON.stringify({ data, timestamp: Date.now() }));
        }
      })
      .subscribe();

    const standingsChannel = supabase.channel('home_standings_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, async (payload: any) => {
        // Se una partita termina, ricarica la classifica
        if (payload.new?.status === 'TERMINATA' || payload.old?.status === 'TERMINATA') {
          const { data } = await supabase.from('standings').select('*');
          if (isMounted && data) {
            setStandings(data.slice(0, 3));
            
            // Mantieni allineata la cache locale per evitare flash di dati vecchi alla navigazione
            const win = window as any;
            if (!win.__cage_cache) win.__cage_cache = {};
            win.__cage_cache['cage-standings'] = { data, timestamp: Date.now() };
            localStorage.setItem('cage-standings', JSON.stringify({ data, timestamp: Date.now() }));
          }
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(standingsChannel);
    };
  }, []);

  const toggle = (i: number) => setExpanded(expanded === i ? null : i);

  // Filtra i giocatori in base al termine di ricerca
  const filteredPlayers = playersAll.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtra le squadre in base al termine di ricerca (nome squadra o giocatore)
  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.players.some((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderRosterContent = () => {
    if (tab === 'squadre') {
      if (filteredTeams.length > 0) {
        return (
          <div className="flex flex-col gap-3 w-full">
            {filteredTeams.map((team, i) => (
              <div key={team.name} className="glass-card overflow-hidden transition-all duration-300 hover:border-white/20">
                <div 
                  className="flex items-center gap-4 p-5 cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors" 
                  onClick={() => toggle(i)}
                >
                  {(() => {
                    const logo = getTeamLogo(team.name);
                    return logo ? (
                      <img src={logo} alt={team.name} className="team-avatar object-cover" style={{ width: 38, height: 38, borderRadius: 12 }} />
                    ) : (
                      <div className={`team-avatar avatar-${team.idx}`} style={{ width: 38, height: 38, borderRadius: 12 }}>
                        {AVATAR_INITIALS(team.name)}
                      </div>
                    );
                  })()}
                  <div style={{ flex: 1 }}>
                    <div className="font-extrabold text-[0.98rem] text-white leading-tight">{team.name}</div>
                  </div>
                  <div 
                    className="text-white/40 text-xs transition-transform duration-300" 
                    style={{ transform: expanded === i ? 'rotate(180deg)' : 'rotate(0)' }}
                  >
                    ▼
                  </div>
                </div>

                {/* Lista Giocatori (Accordion) */}
                <div
                  className="transition-all duration-300 ease-[var(--ease-apple)] bg-[rgba(0,0,0,0.25)] shadow-[inset_0_2px_10px_rgba(0,0,0,0.35)]"
                  style={{
                    overflow: 'hidden',
                    maxHeight: expanded === i ? `${team.players.length * 64}px` : '0px',
                  }}
                >
                  {team.players.map((player: any, j: number) => {
                    const { displayName, isExtra } = parsePlayerName(player.name);
                    return (
                      <div 
                        key={player.id} 
                        onClick={() => setSelectedPlayerId(player.id)}
                        className={`flex items-center gap-4 px-8 py-4 text-[0.98rem] border-b border-[var(--glass-border)] last:border-b-0 cursor-pointer hover:bg-white/[0.04] transition-colors ${
                          isExtra ? 'bg-amber-500/[0.02] border-t border-dashed border-amber-500/10' : ''
                        }`}
                      >
                        <div className="text-white/30 font-mono text-xs w-4 text-center">
                          {isExtra ? '★' : j + 1}
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white/95 hover:text-blue-400 transition-colors truncate">{displayName}</span>
                          </div>
                          <div className="flex items-center gap-2 pr-12">
                            {getRoleBadge(player.role)}
                            {isExtra && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/20 uppercase tracking-wider">
                                Slot Extra
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      } else {
        return (
          <div className="glass-card p-8 text-center text-white/40 text-xs italic w-full">
            Nessuna squadra corrisponde alla ricerca.
          </div>
        );
      }
    } else {
      if (filteredPlayers.length > 0) {
        return (
          <div className="glass-card overflow-hidden w-full">
            {filteredPlayers.map((p) => {
              const { displayName, isExtra } = parsePlayerName(p.name);
              return (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedPlayerId(p.id)}
                  className="flex items-center gap-4 py-4 px-5 border-b border-[var(--glass-border)] last:border-b-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer"
                >
                  {(() => {
                    const logo = getTeamLogo(p.team);
                    return logo ? (
                      <img src={logo} alt={p.team} className="team-avatar object-cover" style={{ width: 30, height: 30, borderRadius: 8 }} />
                    ) : (
                      <div className={`team-avatar avatar-${p.idx}`} style={{ width: 30, height: 30, borderRadius: 8, fontSize: '0.65rem' }}>
                        {AVATAR_INITIALS(p.team)}
                      </div>
                    );
                  })()}
                  <div style={{ flex: 1 }} className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'white' }} className="hover:text-blue-400 transition-colors">
                          {displayName}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }} className="uppercase font-semibold tracking-wider mt-0.5">{p.team}</div>
                    </div>
                    <div className="flex items-center gap-2 pr-12">
                      {getRoleBadge(p.role)}
                      {isExtra && (
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/20 uppercase tracking-wider">
                          Slot Extra
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      } else {
        return (
          <div className="glass-card p-8 text-center text-white/40 text-xs italic w-full">
            Nessun giocatore corrisponde alla ricerca.
          </div>
        );
      }
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* ── Page Header / Branding ── */}
      <div className="page-header animate-[slideUpFade_0.6s_var(--ease-apple)] flex flex-col items-center">
        <img 
          src="/Logo_Torneo.webp" 
          alt="Logo Torneo" 
          className="w-24 h-24 mx-auto mb-4 object-contain" 
        />
        <h1 className="page-title text-3xl font-extrabold tracking-tight">Memorial Gerry</h1>
        <p className="page-subtitle text-sm text-[var(--text-muted)] mt-1">Torneo di Calcio a 5 • The Cage</p>
        <div className="accent-line mx-auto mt-3"></div>

        {/* Quick Info Chips */}
        <div className="flex flex-wrap justify-center gap-3 mt-5 w-full max-w-[500px] px-4">
          <button
            onClick={() => setSelectedImage('/menudefinitivo.jpeg')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black text-white/90 uppercase tracking-wider bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur active:scale-95 cursor-pointer outline-none shadow-[0_2px_8px_rgba(255,255,255,0.03)]"
          >
            <span>🍔</span>
            <span>Menu Taverna</span>
          </button>
          <button
            onClick={() => setSelectedImage('/Graficaquiz.jpeg')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black text-white/90 uppercase tracking-wider bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur active:scale-95 cursor-pointer outline-none shadow-[0_2px_8px_rgba(255,255,255,0.03)]"
          >
            <span>🧠</span>
            <span>Il Quizzone</span>
          </button>
          <button
            onClick={() => setSelectedImage('/mvp_20260624.png')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black text-white/90 uppercase tracking-wider bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur active:scale-95 cursor-pointer outline-none shadow-[0_2px_8px_rgba(255,255,255,0.03)]"
          >
            <span>🏅</span>
            <span>Vota MVP</span>
          </button>
        </div>
      </div>

      {/* ── Dashboard: Grid di Widget ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full animate-[slideUpFade_0.6s_var(--ease-apple)] delay-75">
        
        {/* Widget 1: Partita in Evidenza */}
        <div className="flex flex-col h-full">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3 text-center w-full">Partita in Evidenza</h2>
          {featuredMatch ? (
            <GlassEffect 
              className={`rounded-[24px] flex flex-col h-full min-h-[240px] transition-all duration-300 ${
                featuredMatch.type === 'LIVE' 
                  ? 'live-card-glow' 
                  : 'border-[var(--glass-border)]'
              }`}
              contentClassName="p-6 pb-12 flex flex-col justify-between flex-1 w-full"
            >
              {/* Header del Match Centrato */}
              <div className="flex flex-col items-center gap-2 w-full">
                {featuredMatch.type === 'LIVE' ? (
                  <span className="flex items-center gap-1.5 bg-red-500/20 text-red-400 text-[0.65rem] font-black uppercase px-2.5 py-1 rounded-full animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    Live Now
                  </span>
                ) : featuredMatch.type === 'UPCOMING' ? (
                  <span className="bg-blue-500/20 text-blue-400 text-[0.65rem] font-bold uppercase px-2.5 py-1 rounded-full">
                    Prossimo Match
                  </span>
                ) : (
                  <span className="bg-white/10 text-white/60 text-[0.65rem] font-bold uppercase px-2.5 py-1 rounded-full">
                    Ultimo Risultato
                  </span>
                )}
                <span className="text-[0.65rem] font-bold text-white/50 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-full">
                  {featuredMatch.match.round}
                </span>
              </div>

              {/* Scoreboard centrale */}
              <div className="flex items-center justify-between gap-4 py-4 my-auto">
                {/* Casa */}
                <div className="flex flex-col items-center flex-1 min-w-0">
                  {(() => {
                    const logo = getTeamLogo(featuredMatch.match.home_team.name);
                    return logo ? (
                      <img src={logo} alt={featuredMatch.match.home_team.name} className="team-avatar w-10 h-10 rounded-xl mb-2 object-cover" />
                    ) : (
                      <div className={`team-avatar avatar-${AVATAR_IDX[featuredMatch.match.home_team.name] ?? 0} w-10 h-10 rounded-xl mb-2 text-xs`}>
                        {AVATAR_INITIALS(featuredMatch.match.home_team.name)}
                      </div>
                    );
                  })()}
                  <span className="font-extrabold text-[0.8rem] md:text-sm text-white text-center leading-tight truncate w-full">
                    {featuredMatch.match.home_team.name}
                  </span>
                </div>

                {/* VS / Score */}
                <div className="flex flex-col items-center">
                  {featuredMatch.type === 'UPCOMING' ? (
                    <div className="text-xs font-bold text-white/40 uppercase tracking-widest bg-white/5 py-1.5 px-3 rounded-lg border border-white/5">
                      VS
                    </div>
                  ) : (
                    <div className="text-2xl font-black text-white tabular-nums tracking-widest bg-black/30 border border-[var(--glass-border)] py-1.5 px-4 rounded-xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]">
                      {featuredMatch.match.home_score} - {featuredMatch.match.away_score}
                    </div>
                  )}
                </div>

                {/* Trasferta */}
                <div className="flex flex-col items-center flex-1 min-w-0">
                  {(() => {
                    const logo = getTeamLogo(featuredMatch.match.away_team.name);
                    return logo ? (
                      <img src={logo} alt={featuredMatch.match.away_team.name} className="team-avatar w-10 h-10 rounded-xl mb-2 object-cover" />
                    ) : (
                      <div className={`team-avatar avatar-${AVATAR_IDX[featuredMatch.match.away_team.name] ?? 1} w-10 h-10 rounded-xl mb-2 text-xs`}>
                        {AVATAR_INITIALS(featuredMatch.match.away_team.name)}
                      </div>
                    );
                  })()}
                  <span className="font-extrabold text-[0.8rem] md:text-sm text-white text-center leading-tight truncate w-full">
                    {featuredMatch.match.away_team.name}
                  </span>
                </div>
              </div>

              {/* Info orario / Pulsante live Centrati */}
              <div className="flex flex-col items-center gap-3 w-full pt-4 border-t border-[var(--glass-border)] mt-4">
                <span className="text-[0.75rem] font-semibold text-white/55 text-center">
                  {featuredMatch.type === 'UPCOMING' 
                    ? new Date(featuredMatch.match.match_date).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : new Date(featuredMatch.match.match_date).toLocaleString('it-IT', { day: '2-digit', month: 'short' })}
                </span>
                {featuredMatch.type === 'LIVE' ? (
                  <a 
                    href={`/live?id=${featuredMatch.match.id}`} 
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 border border-red-500/40 text-[0.75rem] font-black text-white uppercase tracking-wider transition-all duration-300 hover:scale-[1.05] active:scale-[0.97] shadow-[0_4px_15px_rgba(239,68,68,0.4)] cursor-pointer"
                  >
                    <span>Segui Diretta</span>
                    <span>📺</span>
                  </a>
                ) : featuredMatch.type === 'LAST' ? (
                  <a 
                    href={`/live?id=${featuredMatch.match.id}`} 
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 border border-blue-500/40 text-[0.75rem] font-bold text-white uppercase tracking-wider transition-all duration-300 hover:scale-[1.05] active:scale-[0.97] shadow-[0_4px_15px_rgba(59,130,246,0.35)] cursor-pointer"
                  >
                    <span>Dettagli Match</span>
                    <span>📊</span>
                  </a>
                ) : (
                  <a 
                    href="/calendario" 
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 border border-blue-500/40 text-[0.75rem] font-bold text-white uppercase tracking-wider transition-all duration-300 hover:scale-[1.05] active:scale-[0.97] shadow-[0_4px_15px_rgba(59,130,246,0.35)] cursor-pointer"
                  >
                    <span>Calendario</span>
                    <span>📅</span>
                  </a>
                )}
              </div>
            </GlassEffect>
          ) : (
            <GlassEffect 
              className="rounded-[24px] flex flex-col h-full min-h-[240px]"
              contentClassName="p-8 flex items-center justify-center text-center flex-1 w-full text-white/50 text-sm"
            >
              Nessun match programmato
            </GlassEffect>
          )}
        </div>

        {/* Widget 2: Anteprima Classifica */}
        <div className="flex flex-col h-full">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3 text-center w-full">Classifica</h2>
          <GlassEffect 
            className="rounded-[24px] flex flex-col h-full min-h-[240px]"
            contentClassName="p-6 pb-12 flex flex-col justify-between flex-1 w-full"
          >
            {standings.length > 0 ? (
              <div className="w-full flex flex-col flex-1 justify-between">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--glass-border)] pb-2">
                      <th className="text-[0.6rem] font-bold text-white/40 uppercase py-1 text-center w-8">#</th>
                      <th className="text-[0.6rem] font-bold text-white/40 uppercase py-1">Squadra</th>
                      <th className="text-[0.6rem] font-bold text-white/40 uppercase py-1 text-center w-8">G</th>
                      <th className="text-[0.6rem] font-bold text-white/40 uppercase py-1 text-center w-8">PT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row, i) => (
                      <tr key={i} className="border-b border-white/[0.03] last:border-b-0">
                        <td className="py-2.5 text-center text-xs font-bold text-white/50">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td className="py-2.5 font-bold text-xs text-white">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const logo = getTeamLogo(row.team_name);
                              return logo ? (
                                <img src={logo} alt={row.team_name} className="team-avatar w-5 h-5 rounded-md object-cover" />
                              ) : (
                                <div className={`team-avatar avatar-${AVATAR_IDX[row.team_name] ?? 0} w-5 h-5 rounded-md text-[0.5rem]`}>
                                  {AVATAR_INITIALS(row.team_name)}
                                </div>
                              );
                            })()}
                            <span className="truncate max-w-[120px] md:max-w-[150px]">{row.team_name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-center text-xs text-white/75 font-mono">{row.g}</td>
                        <td className="py-2.5 text-center text-xs font-black text-blue-400 font-mono">{row.pt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pt-4 border-t border-[var(--glass-border)] flex justify-center w-full mt-4">
                  <a 
                    href="/classifica" 
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 border border-blue-500/40 text-[0.75rem] font-bold text-white uppercase tracking-wider transition-all duration-300 hover:scale-[1.05] active:scale-[0.97] shadow-[0_4px_15px_rgba(59,130,246,0.35)] cursor-pointer"
                  >
                    <span>Classifica Completa</span>
                    <span>🏆</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center text-center w-full h-full text-white/50 text-sm">
                Nessun dato classifica
              </div>
            )}
          </GlassEffect>
        </div>

      </div>

      {/* ── Sezione Inferiore: Rose e Giocatori ── */}
      <div className="w-full mt-10 flex flex-col items-stretch animate-[slideUpFade_0.6s_var(--ease-apple)] delay-150">
         
         {/* Intestazione Sezione */}
        <div className="flex flex-col items-center" style={{ marginBottom: '12px' }}>
          <h2 className="text-lg font-black text-white uppercase tracking-wider text-center">Esplora il Torneo</h2>
          <div className="h-[2px] w-8 mt-1.5 rounded bg-gradient-to-r from-blue-500 to-purple-500" />
        </div>

        {/* Chips Toggle Locale */}
        <div className="flex justify-center w-full" style={{ marginTop: '16px', marginBottom: '16px' }}>
          <div className="flex justify-center gap-3 w-full max-w-[360px] px-4">
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

        {/* Filtro Ricerca Centrato con Spazio Verticale (Sempre visibile per consistenza e UX premium) */}
        <div className="flex justify-center w-full px-4" style={{ marginTop: '12px', marginBottom: '20px' }}>
          <div className="w-full max-w-[400px] animate-[slideUpFade_0.4s_var(--ease-spring)]">
            <GlassEffect className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-white/5 bg-black/20">
              <span className="text-white/40 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Cerca giocatore o squadra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder-white/30"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="text-white/40 hover:text-white/70 text-xs px-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </GlassEffect>
          </div>
        </div>

        {/* Liste Dati */}
        <div className="animate-stagger w-full" key={tab}>
          {renderRosterContent()}
        </div>

      </div>
      {selectedPlayerId && (
        <PlayerStatsModal 
          playerId={selectedPlayerId} 
          onClose={() => setSelectedPlayerId(null)} 
        />
      )}
      {selectedImage && (
        <div 
          className="modal-overlay cursor-pointer flex flex-col justify-center items-center gap-4" 
          onClick={() => setSelectedImage(null)}
          style={{ zIndex: 99999, backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
        >
          {/* Controls Bar */}
          <div className="flex items-center justify-between w-full max-w-[90%] md:max-w-[600px] px-2" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <a 
                href={selectedImage} 
                download={
                  selectedImage.toLowerCase().includes('menu') 
                    ? 'Menu_Taverna_Memorial_Gerry.jpeg' 
                    : selectedImage.toLowerCase().includes('mvp')
                      ? 'MVP_Martedi_23_Gerry.png'
                      : 'Quizzone_Memorial_Gerry.jpeg'
                }
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 border border-blue-500/30 text-xs font-bold text-white transition-colors cursor-pointer outline-none shadow-[0_2px_8px_rgba(59,130,246,0.2)]"
              >
                <span>Scarica File</span>
                <span>⬇️</span>
              </a>
              {selectedImage.toLowerCase().includes('mvp') && (
                <a 
                  href="https://www.instagram.com/torneomemorialgerry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500 hover:opacity-90 border border-pink-500/30 text-xs font-black text-white transition-all cursor-pointer outline-none shadow-[0_2px_8px_rgba(236,72,153,0.3)] animate-pulse"
                >
                  <span>Vota su Instagram</span>
                  <span>📸</span>
                </a>
              )}
            </div>
            <button 
              onClick={() => setSelectedImage(null)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/20 cursor-pointer text-sm font-bold outline-none"
              aria-label="Chiudi"
            >
              ✕
            </button>
          </div>

          {/* Image Container */}
          <div className="relative max-w-[90%] max-h-[75vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img 
              src={selectedImage} 
              alt="Ingrandimento" 
              className="rounded-2xl max-w-full max-h-[75vh] object-contain shadow-2xl border border-white/10"
              style={{ animation: 'modalSlideUp 0.3s var(--ease-spring)' }}
              onClick={() => setSelectedImage(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
