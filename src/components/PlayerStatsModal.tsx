import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import GlassEffect from './GlassEffect';

interface PlayerStatsModalProps {
  playerId: string;
  onClose: () => void;
}

export default function PlayerStatsModal({ playerId, onClose }: PlayerStatsModalProps) {
  const [loading, setLoading] = useState(true);
  const [playerInfo, setPlayerInfo] = useState<{ name: string; teamName: string } | null>(null);
  const [stats, setStats] = useState({ goals: 0, yellows: 0, reds: 0, powerCards: 0 });
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchPlayerStats() {
      try {
        setLoading(true);
        // 1. Fetch player & team info
        const { data: player, error: pError } = await supabase
          .from('players')
          .select('name, team:teams(name)')
          .eq('id', playerId)
          .single();

        if (pError) throw pError;

        if (isMounted && player) {
          setPlayerInfo({
            name: player.name,
            teamName: (player.team as any)?.name || 'Svincolato'
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
          let yellows = 0;
          let reds = 0;
          let powerCards = 0;

          const processedHistory = events.map(ev => {
            if (ev.type === 'GOAL') goals++;
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

          setStats({ goals, yellows, reds, powerCards });
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

    return () => {
      isMounted = false;
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
        <GlassEffect 
          className="w-full rounded-[28px] p-6 md:p-8 relative overflow-hidden" 
          contentClassName="flex flex-col"
          style={{ display: 'block' }}
        >
          {/* Ambient background glows */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[rgba(59,130,246,0.3)] blur-[40px] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[rgba(139,92,246,0.25)] blur-[40px] pointer-events-none" />

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
                <h3 className="text-xl font-extrabold tracking-tight text-white drop-shadow">
                  {playerInfo.name}
                </h3>
                <span className="text-xs font-black uppercase tracking-widest text-[var(--accent-primary)] mt-1.5 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                  {playerInfo.teamName}
                </span>
                <div className="h-[1px] w-16 mt-4 bg-white/10" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Gol */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/[0.04] p-3 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <span className="text-2xl">⚽</span>
                  <div className="flex flex-col">
                    <span className="text-[0.65rem] font-bold text-white/40 uppercase tracking-wide">Gol Segnati</span>
                    <span className="text-lg font-black text-white">{stats.goals}</span>
                  </div>
                </div>

                {/* Ammonizioni */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/[0.04] p-3 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <span className="text-2xl">🟨</span>
                  <div className="flex flex-col">
                    <span className="text-[0.65rem] font-bold text-white/40 uppercase tracking-wide">Ammonizioni</span>
                    <span className="text-lg font-black text-yellow-400">{stats.yellows}</span>
                  </div>
                </div>

                {/* Espulsioni */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/[0.04] p-3 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <span className="text-2xl">🟥</span>
                  <div className="flex flex-col">
                    <span className="text-[0.65rem] font-bold text-white/40 uppercase tracking-wide">Espulsioni</span>
                    <span className="text-lg font-black text-red-500">{stats.reds}</span>
                  </div>
                </div>

                {/* Carte Speciali */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/[0.04] p-3 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <span className="text-2xl">🃏</span>
                  <div className="flex flex-col">
                    <span className="text-[0.65rem] font-bold text-white/40 uppercase tracking-wide">Carte Giocate</span>
                    <span className="text-lg font-black text-purple-400">{stats.powerCards}</span>
                  </div>
                </div>
              </div>

              {/* Match History / Timeline */}
              <div className="flex flex-col flex-1 min-h-0">
                <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 px-1">Cronologia Eventi</h4>
                <div 
                  className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {history.length > 0 ? (
                    history.map((h, i) => {
                      const dateStr = h.date ? h.date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '';
                      const emoji = h.type === 'GOAL' ? '⚽' : h.type === 'YELLOW_CARD' ? '🟨' : h.type === 'RED_CARD' ? '🟥' : '🃏';
                      const desc = h.type === 'GOAL' 
                        ? 'Gol' 
                        : h.type === 'YELLOW_CARD' 
                          ? 'Ammonizione' 
                          : h.type === 'RED_CARD' 
                            ? 'Espulsione' 
                            : `Power Card (${h.detail || 'Attivata'})`;

                      return (
                        <div key={i} className="flex items-center justify-between bg-black/15 border border-white/5 p-3 rounded-xl">
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
                    <div className="text-center text-white/40 text-xs italic py-8 border border-white/5 bg-black/10 rounded-xl">
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
  );
}
