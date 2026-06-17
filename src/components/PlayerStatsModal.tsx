import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import GlassEffect from './GlassEffect';
import { parsePlayerName } from '../lib/teamUtils';

interface PlayerStatsModalProps {
  playerId: string;
  onClose: () => void;
  themeColor?: 'home' | 'away' | 'neutral';
}

const getRoleBadge = (role: string) => {
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
      icon: '⚡',
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

export default function PlayerStatsModal({ playerId, onClose, themeColor = 'neutral' }: PlayerStatsModalProps) {
  const isHome = themeColor === 'home';
  const isAway = themeColor === 'away';
  
  const borderStyle = isHome 
    ? '1px solid rgba(239, 68, 68, 0.25)' 
    : isAway
      ? '1px solid rgba(59, 130, 246, 0.25)'
      : '1px solid rgba(139, 92, 246, 0.25)';
      
  const hoverGlowStart = isHome 
    ? 'rgba(239, 68, 68, 0.35)' 
    : isAway
      ? 'rgba(59, 130, 246, 0.35)'
      : 'rgba(139, 92, 246, 0.35)';
      
  const hoverGlowEnd = isHome 
    ? 'rgba(239, 68, 68, 0.05)' 
    : isAway
      ? 'rgba(59, 130, 246, 0.05)'
      : 'rgba(139, 92, 246, 0.05)';
      
  const innerGlow = isHome
    ? 'inset 1.5px 1.5px 1.5px 0 rgba(239, 68, 68, 0.25), inset -1px -1px 1px 0 rgba(255, 255, 255, 0.04)'
    : isAway
      ? 'inset 1.5px 1.5px 1.5px 0 rgba(59, 130, 246, 0.25), inset -1px -1px 1px 0 rgba(255, 255, 255, 0.04)'
      : 'inset 1.5px 1.5px 1.5px 0 rgba(139, 92, 246, 0.25), inset -1px -1px 1px 0 rgba(255, 255, 255, 0.04)';
      
  const stackBorderColor = isHome 
    ? 'rgba(239, 68, 68, 0.18)' 
    : isAway
      ? 'rgba(59, 130, 246, 0.18)'
      : 'rgba(139, 92, 246, 0.18)';
      
  const stackGlowColor = isHome 
    ? 'rgba(239, 68, 68, 0.03)' 
    : isAway
      ? 'rgba(59, 130, 246, 0.03)'
      : 'rgba(139, 92, 246, 0.03)';
  const [loading, setLoading] = useState(true);
  const [playerInfo, setPlayerInfo] = useState<{ name: string; teamName: string; role?: string | null } | null>(null);
  const [stats, setStats] = useState({ goals: 0, assists: 0, yellows: 0, reds: 0, powerCards: 0 });
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchPlayerStats() {
      try {
        setLoading(true);
        // 1. Fetch player & team info
        const { data: player, error: pError } = await supabase
          .from('players')
          .select('name, role, team:teams(name)')
          .eq('id', playerId)
          .single();

        if (pError) throw pError;

        if (isMounted && player) {
          setPlayerInfo({
            name: player.name,
            teamName: (player.team as any)?.name || 'Svincolato',
            role: (player as any).role
          });
        }

        // 2. Fetch all match events for this player
        const { data: events, error: eError } = await supabase
          .from('match_events')
          .select(`
            id,
            minute,
            type,
            detail,
            created_at,
            match:matches (
              id,
              match_date,
              round,
              home_team_id,
              home_team:teams!home_team_id ( name ),
              away_team:teams!away_team_id ( name )
            )
          `)
          .eq('player_id', playerId)
          .order('created_at', { ascending: false });

        if (eError) throw eError;

        if (isMounted && events) {
          // Calculate aggregate stats
          let goals = 0;
          let assists = 0;
          let yellows = 0;
          let reds = 0;
          let powerCards = 0;

          const processedHistory = events.map(ev => {
            if (ev.type === 'GOAL') goals++;
            else if (ev.type === 'ASSIST') assists++;
            else if (ev.type === 'YELLOW_CARD') yellows++;
            else if (ev.type === 'RED_CARD') reds++;
            else if (ev.type === 'POWER_CARD' || ev.type === 'CARTA') powerCards++;

            // Determine opponent
            const matchData = ev.match as any;
            const homeName = matchData?.home_team?.name || 'N/D';
            const awayName = matchData?.away_team?.name || 'N/D';
            const isHome = player?.team && (player.team as any).name === homeName;
            const opponent = isHome ? awayName : homeName;

            return {
              id: ev.id,
              minute: ev.minute,
              type: ev.type,
              detail: ev.detail,
              round: matchData?.round || 'Partita',
              opponent,
              date: matchData?.match_date ? new Date(matchData.match_date) : null
            };
          });

          setStats({ goals, assists, yellows, reds, powerCards });
          setHistory(processedHistory);
        }
      } catch (error) {
        console.error('Errore nel caricamento delle statistiche del giocatore:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (playerId) {
      fetchPlayerStats();
    }

    // Sottoscrizione realtime per aggiornamenti live delle statistiche del giocatore
    const channel = supabase.channel(`player_stats_sync_${playerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_events', filter: `player_id=eq.${playerId}` },
        () => {
          console.log(`Realtime match event detected for player ${playerId}, refreshing stats...`);
          fetchPlayerStats();
        }
      )
      .subscribe((status) => {
        console.log(`Player ${playerId} realtime channel status:`, status);
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [playerId]);

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{ zIndex: 99999 }} // Assicura che sia sopra qualsiasi navigazione
    >
      <div 
        onClick={e => e.stopPropagation()} 
        className="w-full max-w-[450px] px-4"
      >
        <div 
          className="liquid-glass-stack-wrapper w-full"
          style={{
            '--stack-border-color': stackBorderColor,
            '--stack-glow-color': stackGlowColor,
          } as React.CSSProperties}
        >
          <GlassEffect 
            className="w-full rounded-[28px] relative overflow-hidden" 
            contentClassName="p-6 md:p-8 flex flex-col"
            style={{ 
              display: 'block',
              border: borderStyle,
              '--hover-glow-start': hoverGlowStart,
              '--hover-glow-end': hoverGlowEnd,
              '--card-inner-glow': innerGlow,
            } as React.CSSProperties}
          >
            {/* Ambient background glows */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] pointer-events-none ${
              isHome 
                ? 'bg-[rgba(239,68,68,0.25)]' 
                : isAway 
                  ? 'bg-[rgba(59,130,246,0.25)]' 
                  : 'bg-[rgba(139,92,246,0.25)]'
            }`} />
            <div className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-[40px] pointer-events-none ${
              isHome 
                ? 'bg-[rgba(244,63,94,0.18)]' 
                : isAway 
                  ? 'bg-[rgba(6,182,212,0.18)]' 
                  : 'bg-[rgba(236,72,153,0.18)]'
            }`} />

            {/* Close button top right */}
            <button 
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer z-50"
              onClick={onClose}
              aria-label="Chiudi"
            >
              ✕
            </button>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/50 text-sm gap-3">
                <span className="animate-spin text-xl">⏳</span>
                Caricamento statistiche...
              </div>
            ) : playerInfo ? (
              <div className="relative z-10 flex flex-col w-full">
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-6">
                  {(() => {
                    const { displayName, isExtra } = parsePlayerName(playerInfo.name);
                    return (
                      <div className="flex flex-col items-center gap-1.5">
                        <h3 className="text-xl font-extrabold tracking-tight text-white drop-shadow">
                          {displayName}
                        </h3>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(playerInfo.role || '')}
                          {isExtra && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/20 uppercase tracking-wider">
                              Slot Extra
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  <span className={`text-xs font-black uppercase tracking-widest mt-2 px-3 py-1 rounded-full border ${
                    isHome 
                      ? 'text-red-400 bg-red-500/10 border-red-500/20' 
                      : isAway 
                        ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' 
                        : 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                  }`}>
                    {playerInfo.teamName}
                  </span>
                  <div className="h-[1px] w-16 mt-4 bg-white/10" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Gol */}
                  <div className="flex flex-col items-center justify-center text-center bg-white/5 border border-white/[0.04] p-3 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                    <span className="text-2xl mb-1">⚽</span>
                    <span className="text-[0.65rem] font-bold text-white/40 uppercase tracking-wide">Gol Segnati</span>
                    <span className="text-lg font-black text-white mt-0.5">{stats.goals}</span>
                  </div>

                  {/* Assist */}
                  <div className="flex flex-col items-center justify-center text-center bg-white/5 border border-white/[0.04] p-3 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                    <span className="text-2xl mb-1">🎯</span>
                    <span className="text-[0.65rem] font-bold text-white/40 uppercase tracking-wide">Assist</span>
                    <span className="text-lg font-black text-white mt-0.5">{stats.assists}</span>
                  </div>

                  {/* Ammonizioni */}
                  <div className="flex flex-col items-center justify-center text-center bg-white/5 border border-white/[0.04] p-3 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                    <span className="text-2xl mb-1">🟨</span>
                    <span className="text-[0.65rem] font-bold text-white/40 uppercase tracking-wide">Ammonizioni</span>
                    <span className="text-lg font-black text-yellow-400 mt-0.5">{stats.yellows}</span>
                  </div>

                  {/* Espulsioni */}
                  <div className="flex flex-col items-center justify-center text-center bg-white/5 border border-white/[0.04] p-3 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                    <span className="text-2xl mb-1">🟥</span>
                    <span className="text-[0.65rem] font-bold text-white/40 uppercase tracking-wide">Espulsioni</span>
                    <span className="text-lg font-black text-red-500 mt-0.5">{stats.reds}</span>
                  </div>
                </div>

                {/* Match History / Timeline */}
                <div className="flex flex-col flex-1 min-h-0 w-full">
                  <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 px-1 text-center">Cronologia Eventi</h4>
                  <div 
                    className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin items-center w-full"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {history.length > 0 ? (
                      history.map((h, i) => {
                        const dateStr = h.date ? h.date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '';
                        const emoji = h.type === 'GOAL' ? '⚽' : h.type === 'ASSIST' ? '🎯' : h.type === 'YELLOW_CARD' ? '🟨' : h.type === 'RED_CARD' ? '🟥' : '🃏';
                        const desc = h.type === 'GOAL' 
                          ? 'Gol' 
                          : h.type === 'ASSIST' 
                            ? 'Assist'
                            : h.type === 'YELLOW_CARD' 
                              ? 'Ammonizione' 
                              : h.type === 'RED_CARD' 
                                ? 'Espulsione' 
                                : `Power Card (${h.detail || 'Attivata'})`;

                        return (
                          <div key={i} className="flex items-center justify-between bg-black/15 border border-white/5 p-3 rounded-xl w-[80%] flex-shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-base flex-shrink-0">{emoji}</span>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-white leading-tight truncate">
                                  {desc} {h.detail && h.type !== 'POWER_CARD' && h.type !== 'CARTA' && `(${h.detail})`}
                                </span>
                                <span className="text-[0.65rem] text-white/40 mt-0.5 truncate">
                                  {h.round} vs {h.opponent}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end flex-shrink-0 pl-2">
                              <span className="text-xs font-mono font-black text-[var(--accent-primary)]">{h.minute}'</span>
                              <span className="text-[0.6rem] text-white/35 font-semibold mt-0.5">{dateStr}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-white/40 text-xs italic py-8 border border-white/5 bg-black/10 rounded-xl w-[80%]">
                        Nessun evento registrato in archivio per questo giocatore.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-red-400 text-sm gap-2">
                <span>⚠️</span>
                Giocatore non trovato.
              </div>
            )}
          </GlassEffect>
        </div>
      </div>
    </div>
  );
}
