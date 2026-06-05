import React, { useState, useEffect } from 'react';
import GlassEffect from './GlassEffect';
import { supabase } from '../lib/supabase';

const AVATAR_INITIALS = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export default function LiveMatchIsland() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [liveMatch, setLiveMatch] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const { data: match } = await supabase
        .from('matches')
        .select('*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)')
        .eq('status', 'LIVE')
        .single();
      
      if (!isMounted) return;

      if (match) {
        setLiveMatch(match);
        
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
          console.warn('Errore aggiornamento cache al caricamento live:', e);
        }

        const { data: evts } = await supabase
          .from('match_events')
          .select('*, player:players!player_id(name, team_id)')
          .eq('match_id', match.id)
          .order('minute', { ascending: false });
        
        if (isMounted && evts) setEvents(evts);
      } else {
        setLiveMatch(null);
        setEvents([]);
      }
      setLoading(false);
    }

    if (loading) {
      loadData();
    }

    let channel: any = null;

    if (liveMatch?.id) {
      // 1. Sottoscrizione filtrata per la specifica partita live
      channel = supabase.channel(`live_match_${liveMatch.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${liveMatch.id}` },
          (payload) => {
            if (payload.new && (payload.new as any).status !== 'LIVE') {
              if (isMounted) {
                setLiveMatch(null);
                setEvents([]);

                // Aggiorna cache locale per riflettere lo stato non più live (es. TERMINATA)
                try {
                  const lsStr = localStorage.getItem('cage-matches');
                  if (lsStr) {
                    const cached = JSON.parse(lsStr);
                    if (cached && cached.data) {
                      const idx = cached.data.findIndex((m: any) => m.id === (payload.new as any).id);
                      if (idx !== -1) {
                        cached.data[idx] = {
                          ...cached.data[idx],
                          status: (payload.new as any).status,
                          home_score: (payload.new as any).home_score,
                          away_score: (payload.new as any).away_score
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
                  console.warn('Errore aggiornamento cache a fine partita:', e);
                }
              }
            } else {
              if (isMounted) {
                setLiveMatch(prev => {
                  const updated = { ...prev, ...payload.new };

                  // Aggiorna cache locale per il punteggio live
                  try {
                    const lsStr = localStorage.getItem('cage-matches');
                    if (lsStr) {
                      const cached = JSON.parse(lsStr);
                      if (cached && cached.data) {
                        const idx = cached.data.findIndex((m: any) => m.id === updated.id);
                        if (idx !== -1) {
                          cached.data[idx] = {
                            ...cached.data[idx],
                            status: updated.status,
                            home_score: updated.home_score,
                            away_score: updated.away_score
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
                    console.warn('Errore aggiornamento cache punteggio live:', e);
                  }

                  return updated;
                });
              }
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
    } else if (!loading) {
      // 2. Se non c'è una partita live, ascolta solo se una qualsiasi partita passa in stato LIVE
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
  }, [liveMatch?.id, loading]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    // Tilt limit to +/- 10 degrees.
    const degX = -(mouseY / (height / 2)) * 10;
    const degY = (mouseX / (width / 2)) * 10;
    
    setTilt({ x: degX, y: degY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const isTilting = tilt.x !== 0 || tilt.y !== 0;

  if (loading) return <div className="p-8 text-center text-white">Caricamento diretta...</div>;
  
  if (!liveMatch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
        <div className="text-4xl mb-4">📺</div>
        <h2 className="text-xl font-bold mb-2">Nessuna partita in diretta</h2>
        <p className="text-white/60 mb-6">Non ci sono match attualmente in corso.</p>
        <a href="/calendario" className="install-btn px-6 py-2">Torna al Calendario</a>
      </div>
    );
  }

  const homeName = liveMatch.home_team?.name || 'Home';
  const awayName = liveMatch.away_team?.name || 'Away';
  const homeScore = liveMatch.home_score || 0;
  const awayScore = liveMatch.away_score || 0;

  return (
    <div className="flex flex-col w-full text-white min-h-screen">
      {/* Header 3D Container with Perspective */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full overflow-hidden border-b-[3px] border-[#382613]"
        style={{ 
          height: '320px', 
          perspective: '1000px', 
          boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Layer 1: Background Field Image (STATIC - not scaled, sits behind parallax elements) */}
        <div 
          className="absolute inset-0 bg-cover bg-bottom bg-no-repeat"
          style={{ 
            backgroundImage: `url('/3d-field.webp')`,
          }}
        />
        
        {/* Layer 2: Ambient Lighting Overlay (STATIC) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,0,0,0.8)] via-[rgba(0,0,0,0.2)] to-transparent" />

        {/* Top Navbar - STATIC & CLICKABLE (Always flat and on top of tilted layers) */}
        <div className="absolute top-5 left-6 right-6 flex items-center justify-between z-30">
           <GlassEffect className="w-10 h-10 rounded-full hover:scale-105 active:scale-95 transition-all duration-300">
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
                 className="w-5 h-5 text-white opacity-85 hover:opacity-100 transition-opacity -translate-x-[1px]"
               >
                 <polyline points="15 18 9 12 15 6" />
               </svg>
             </a>
           </GlassEffect>

           {/* Glowing Animated LIVE title */}
           <div className="flex items-center gap-2 bg-black/35 backdrop-blur-md py-1.5 px-4 rounded-full border border-white/5 shadow-lg select-none">
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
             </span>
             <span className="font-black tracking-widest text-xs md:text-sm text-white drop-shadow-[0_2px_4px_rgba(255,255,255,0.2)] uppercase">
               Live
             </span>
           </div>

           <div className="w-10"></div> {/* Spacer for perfect centering */}
        </div>

        {/* Tilted Parallax Container (Only scoreboard and logos tilt/float in 3D) */}
        <div
          className={`absolute inset-0 w-full h-full z-20 ${!isTilting ? 'live-field-float' : ''}`}
          style={{
            transform: isTilting ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` : undefined,
            transformStyle: 'preserve-3d',
            transition: isTilting ? 'transform 0.1s ease-out' : 'transform 0.6s ease-out',
          }}
        >
          {/* Layer 3: Scoreboard (strongly extruded) */}
          <div 
            className="absolute top-16 left-0 w-full flex justify-center"
            style={{
              transform: 'translateZ(75px)',
            }}
          >
             <div className="flex items-center gap-6 text-6xl font-light drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] tracking-widest tabular-nums select-none">
               <span className="font-semibold text-white">{homeScore}</span>
               <span className="text-white/60 text-4xl -translate-y-1">:</span>
               <span className="font-semibold text-white">{awayScore}</span>
             </div>
          </div>

          {/* Layer 4: Logos (extruded, with shadows projected back onto the field) */}
          <div 
            className="absolute bottom-12 left-0 w-full flex items-end justify-center"
            style={{
              transform: 'translateZ(55px)',
              transformStyle: 'preserve-3d',
            }}
          >
             <div 
               className="relative flex items-center justify-between w-full max-w-[360px] px-10"
               style={{ transformStyle: 'preserve-3d' }}
             >
                
                 {/* Home Team */}
                 <div 
                   className="relative flex flex-col items-center"
                   style={{ transformStyle: 'preserve-3d' }}
                 >
                    {/* Shadow on the grass */}
                    <div 
                      className="absolute -bottom-3 w-16 h-3 bg-black/60 blur-[4px] rounded-[100%]"
                      style={{
                        transform: 'translateZ(-45px)',
                      }}
                    />
                    {/* Logo */}
                    <div 
                      className="relative w-[4.5rem] h-[5.5rem] rounded-b-full bg-gradient-to-b from-red-600 to-red-800 border-[2px] border-yellow-400/80 shadow-2xl flex flex-col items-center justify-center font-black text-2xl text-white"
                      style={{
                        transform: 'translateZ(10px)',
                      }}
                    >
                      <span className="text-xs uppercase tracking-widest text-yellow-300 mt-2 text-center leading-tight">{AVATAR_INITIALS(homeName)}</span>
                    </div>
                 </div>
                 
                 {/* Away Team */}
                 <div 
                   className="relative flex flex-col items-center"
                   style={{ transformStyle: 'preserve-3d' }}
                 >
                    {/* Shadow on the grass */}
                    <div 
                      className="absolute -bottom-3 w-16 h-3 bg-black/60 blur-[4px] rounded-[100%]"
                      style={{
                        transform: 'translateZ(-45px)',
                      }}
                    />
                    {/* Logo */}
                    <div 
                      className="relative w-[4.5rem] h-[5.5rem] rounded-b-full bg-gradient-to-b from-blue-600 to-blue-900 border-[2px] border-yellow-400/80 shadow-2xl flex flex-col items-center justify-center font-black text-2xl text-white"
                      style={{
                        transform: 'translateZ(10px)',
                      }}
                    >
                      <span className="text-[0.8rem] uppercase tracking-widest text-yellow-300 mt-2 text-center leading-tight">{AVATAR_INITIALS(awayName)}</span>
                    </div>
                 </div>

             </div>
          </div>
        </div>
      </div>

      {/* Timeline background gradient */}
      <div className="relative flex-1 px-4 max-w-[500px] mx-auto w-full pt-12 pb-24">
         <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-20 pointer-events-none"></div>
                  <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/20 -translate-x-1/2"></div>
          
          <div className="flex flex-col gap-8 relative z-10">
            {events.length === 0 ? (
              <div className="text-center text-white/50 text-sm mt-4">Nessun evento ancora registrato in questa partita.</div>
            ) : null}
            {events.map((ev, i) => {
              const isCard = ev.type === 'CARTA';
              const isHome = ev.team_id === liveMatch.home_team_id;
              const playerName = ev.player?.name || 'Sconosciuto';
              const detailType = ev.detail;

              return (
                <div key={i} className="flex items-center w-full min-w-0">
                  {/* Left Side (Home) */}
                  <div className="flex-1 flex justify-end pr-3.5 min-w-0">
                    {isHome && (
                      isCard ? (
                        <div className="flex flex-col items-end gap-1 max-w-full">
                          <span className="text-[0.6rem] font-black tracking-widest text-white/40 uppercase truncate w-full text-right">
                            {playerName}
                          </span>
                          {renderEventMedia({ type: 'Carta Attivata', detail: detailType })}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 text-right flex-row-reverse min-w-0">
                           <div className="flex-shrink-0">
                             {renderEventMedia(ev)}
                           </div>
                           <div className="flex flex-col min-w-0">
                             <span className="font-extrabold text-[0.8rem] md:text-[0.9rem] tracking-wide text-white drop-shadow-md uppercase leading-tight truncate">{playerName}</span>
                             <span className="text-[0.65rem] text-white/60 font-semibold mt-0.5 truncate">{ev.type}</span>
                           </div>
                        </div>
                      )
                    )}
                  </div>
                  
                  {/* Center Dot (Minute) */}
                  <div className="flex-shrink-0 z-10 px-1.5">
                     <div className="w-10 h-10 rounded-full flex items-center justify-center text-[0.85rem] font-bold text-white border border-white/45 bg-white/10 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                       {ev.minute}'
                     </div>
                  </div>

                  {/* Right Side (Away) */}
                  <div className="flex-1 flex justify-start pl-3.5 min-w-0">
                    {!isHome && (
                      isCard ? (
                        <div className="flex flex-col items-start gap-1 max-w-full">
                          <span className="text-[0.6rem] font-black tracking-widest text-white/40 uppercase truncate w-full text-left">
                            {playerName}
                          </span>
                          {renderEventMedia({ type: 'Carta Attivata', detail: detailType })}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 text-left min-w-0">
                           <div className="flex-shrink-0">
                             {renderEventMedia(ev)}
                           </div>
                           <div className="flex flex-col min-w-0">
                             <span className="font-extrabold text-[0.8rem] md:text-[0.9rem] tracking-wide text-white drop-shadow-md uppercase leading-tight truncate">{playerName}</span>
                             <span className="text-[0.65rem] text-white/60 font-semibold mt-0.5 truncate">{ev.type}</span>
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
    case 'Carta Attivata':
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

      const glowClass = cardGlows[ev.detail] || 'shadow-[0_0_8px_rgba(255,255,255,0.15)] border-[rgba(255,255,255,0.06)]';
      const cardName = cardNames[ev.detail] || 'Carta Speciale';
      
      return (
        <div className="relative group">
          <div className="absolute -inset-0.5 rounded-[6px] bg-gradient-to-r from-blue-500 to-purple-500 opacity-15 blur-sm group-hover:opacity-30 transition duration-500 pointer-events-none" />
          
          <div className={`relative flex items-center gap-2 bg-[rgba(10,15,30,0.35)] border border-[rgba(255,255,255,0.06)] rounded-[8px] p-1 pr-2.5 ${glowClass}`}>
            <img 
              src={`/cards/${ev.detail}.webp`} 
              alt={cardName} 
              className="w-7 h-10 rounded-[3px] object-cover shadow-[0_2px_6px_rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.06)]"
            />
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[0.55rem] font-bold text-white/40 uppercase tracking-widest leading-none">Carta Giocata</span>
              <span className="text-[0.65rem] font-black text-white mt-1 uppercase tracking-wide truncate">{cardName}</span>
            </div>
          </div>
        </div>
      );
    default:
      return <span className="text-white">•</span>;
  }
}
