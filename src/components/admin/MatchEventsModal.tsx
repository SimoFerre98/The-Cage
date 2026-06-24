import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import GlassEffect from '../GlassEffect';
import type { Match, Team, Player } from './types';

const formatEventTime = (createdAtStr?: string) => {
  if (!createdAtStr) return '';
  const date = new Date(createdAtStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month} ${hours}:${minutes}`;
};

interface MatchEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  players: Player[];
  onRefreshMatches: () => Promise<void>;
}

export default function MatchEventsModal({
  isOpen,
  onClose,
  match,
  players,
  onRefreshMatches,
}: MatchEventsModalProps) {
  if (!isOpen || !match) return null;

  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Lock body scroll when modal is open to prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Event form state
  const [eventTeamId, setEventTeamId] = useState(match.home_team_id);
  const [eventPlayerId, setEventPlayerId] = useState('');
  const [eventType, setEventType] = useState('GOAL');
  const [eventMinute, setEventMinute] = useState('');

  // Score state
  const [homeScore, setHomeScore] = useState(match.home_score);
  const [awayScore, setAwayScore] = useState(match.away_score);

  // Sync score state when match changes
  useEffect(() => {
    setHomeScore(match.home_score);
    setAwayScore(match.away_score);
    setEventTeamId(match.home_team_id);
    setEventPlayerId('');
    setEventType('GOAL');
    setEventMinute('');
  }, [match]);

  // Fetch match events
  const fetchEvents = useCallback(async () => {
    if (!match) return;
    setLoadingEvents(true);
    const { data, error } = await supabase
      .from('match_events')
      .select(`
        id,
        minute,
        type,
        detail,
        created_at,
        player:players(name)
      `)
      .eq('match_id', match.id)
      .order('minute', { ascending: true });
    if (!error && data) {
      setEvents(data);
    }
    setLoadingEvents(false);
  }, [match.id]);

  useEffect(() => {
    fetchEvents();

    const uniqueChannelName = `modal_events_${match.id}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_events', filter: `match_id=eq.${match.id}` },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.id, fetchEvents]);

  // Handlers
  const handleUpdateScore = async (newHomeScore: number, newAwayScore: number) => {
    const { error } = await supabase
      .from('matches')
      .update({ home_score: newHomeScore, away_score: newAwayScore })
      .eq('id', match.id);
    if (!error) {
      onRefreshMatches();
    } else {
      alert("Errore nell'aggiornamento del punteggio: " + error.message);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTeamId || !eventType || !eventMinute) return;

    let finalType = eventType;
    let finalDetail = null;

    if (eventType.startsWith('CARTA_')) {
      finalType = 'CARTA';
      finalDetail = eventType.replace('CARTA_', '');
    }

    const { error } = await supabase.from('match_events').insert([{
      match_id: match.id,
      team_id: eventTeamId,
      player_id: eventPlayerId || null,
      minute: parseInt(eventMinute),
      type: finalType,
      detail: finalDetail,
    }]);

    if (!error) {
      setEventMinute('');
      setEventPlayerId('');
      fetchEvents();
    } else {
      alert("Errore nell'aggiunta dell'evento: " + error.message);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    // Optimistic UI update
    setEvents(prev => prev.filter(ev => ev.id !== eventId));

    const { error } = await supabase
      .from('match_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      fetchEvents();
      alert("Errore nell'eliminazione dell'evento: " + error.message);
    }
  };

  const updateEventOutcome = async (eventId: string, newDetail: string) => {
    const { error } = await supabase
      .from('match_events')
      .update({ detail: newDetail })
      .eq('id', eventId);
    if (!error) {
      fetchEvents();
    } else {
      alert('Errore: ' + error.message);
    }
  };

  const activePlayers = players.filter(p => p.team_id === eventTeamId);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div className="w-full max-w-[650px] px-4" onClick={e => e.stopPropagation()}>
        <div 
          className="liquid-glass-stack-wrapper w-full"
          style={{
            '--stack-border-color': 'rgba(59, 130, 246, 0.18)',
            '--stack-glow-color': 'rgba(59, 130, 246, 0.03)',
          } as React.CSSProperties}
        >
          <GlassEffect
            className="w-full rounded-[28px] relative overflow-hidden"
            contentClassName="p-6 md:p-8 flex flex-col gap-6"
            style={{
              display: 'block',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              '--hover-glow-start': 'rgba(59, 130, 246, 0.35)',
              '--hover-glow-end': 'rgba(59, 130, 246, 0.05)',
              '--card-inner-glow': 'inset 1.5px 1.5px 1.5px 0 rgba(59, 130, 246, 0.25), inset -1px -1px 1px 0 rgba(255, 255, 255, 0.04)',
            } as React.CSSProperties}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black tracking-tight text-white uppercase">Gestione Eventi</h3>
                <p className="text-white/50 text-xs mt-0.5">Modifica tabellino, assist e sanzioni</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors border border-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scoreboard Editor */}
            <div className="bg-white/5 border border-white/[0.04] p-5 rounded-2xl flex flex-col items-center">
              <span className="text-xs text-white/50 font-bold uppercase tracking-wider mb-3">Punteggio Partita</span>
              <div className="flex items-center justify-center gap-6 w-full">
                {/* Home Team */}
                <div className="flex flex-col items-center flex-1 text-right">
                  <span className="text-sm font-bold text-white leading-tight mb-2 block truncate max-w-[150px]">
                    {match.home_team?.name}
                  </span>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const score = Math.max(0, homeScore - 1);
                        setHomeScore(score);
                        handleUpdateScore(score, awayScore);
                      }}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white font-bold flex items-center justify-center border border-white/5 cursor-pointer text-sm"
                    >
                      -
                    </button>
                    <span className="text-3xl font-black text-white w-10 text-center select-none">
                      {homeScore}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const score = homeScore + 1;
                        setHomeScore(score);
                        handleUpdateScore(score, awayScore);
                      }}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white font-bold flex items-center justify-center border border-white/5 cursor-pointer text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-2xl font-light text-white/30 select-none">:</div>

                {/* Away Team */}
                <div className="flex flex-col items-center flex-1 text-left">
                  <span className="text-sm font-bold text-white leading-tight mb-2 block truncate max-w-[150px]">
                    {match.away_team?.name}
                  </span>
                  <div className="flex items-center gap-2 justify-start">
                    <button
                      type="button"
                      onClick={() => {
                        const score = Math.max(0, awayScore - 1);
                        setAwayScore(score);
                        handleUpdateScore(homeScore, score);
                      }}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white font-bold flex items-center justify-center border border-white/5 cursor-pointer text-sm"
                    >
                      -
                    </button>
                    <span className="text-3xl font-black text-white w-10 text-center select-none">
                      {awayScore}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const score = awayScore + 1;
                        setAwayScore(score);
                        handleUpdateScore(homeScore, score);
                      }}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white font-bold flex items-center justify-center border border-white/5 cursor-pointer text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Columns: Left (Events List), Right (Add Event Form) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Timeline (Left 7 cols) */}
              <div className="md:col-span-7 flex flex-col gap-3">
                <span className="text-xs text-white/60 font-bold uppercase tracking-wider">Cronologia Eventi</span>
                
                <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1 bg-black/10 border border-white/5 p-3 rounded-xl min-h-[150px]">
                  {loadingEvents ? (
                    <div className="text-white/40 text-xs italic py-8 text-center">Caricamento eventi...</div>
                  ) : events.length > 0 ? (
                    events.map((ev) => {
                      const emoji = ev.type === 'GOAL' || ev.type === 'AUTOGOAL' ? '⚽' : ev.type === 'ASSIST' ? '🎯' : ev.type === 'YELLOW_CARD' || ev.type === 'AMMONIZIONE' ? '🟨' : ev.type === 'RED_CARD' || ev.type === 'ESPULSIONE' ? '🟥' : '🃏';
                      const [baseDetail, outcome] = (ev.detail || '').split('::');
                      const isPenaltyOrShootout = ev.type === 'CARTA' && (baseDetail === 'penalty' || baseDetail === 'shootout');

                      const desc = ev.type === 'GOAL'
                        ? 'Gol'
                        : ev.type === 'AUTOGOAL'
                          ? 'Autogol'
                          : ev.type === 'ASSIST'
                            ? 'Assist'
                            : ev.type === 'YELLOW_CARD' || ev.type === 'AMMONIZIONE'
                              ? 'Ammonizione'
                              : ev.type === 'RED_CARD' || ev.type === 'ESPULSIONE'
                                ? 'Espulsione'
                                : `Carta (${baseDetail || 'Attivata'})${outcome === 'success' ? ' ✅ Gol' : outcome === 'fail' ? ' ❌ No Gol' : ''}`;
                      
                      const playerName = ev.player?.name || 'Giocatore Sconosciuto';

                      return (
                        <div key={ev.id} className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.02] p-2.5 rounded-lg transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="text-base flex-shrink-0">{emoji}</span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-white leading-tight">{desc}</span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-white/50 truncate max-w-[150px]">{playerName} ({ev.minute}')</span>
                                {ev.created_at && (
                                  <span className="text-[9px] text-white/30 font-medium whitespace-nowrap">
                                    🕒 {formatEventTime(ev.created_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isPenaltyOrShootout && (
                              <div className="flex items-center gap-0.5 bg-black/35 p-0.5 rounded-md">
                                <button
                                  type="button"
                                  onClick={() => updateEventOutcome(ev.id, `${baseDetail}::success`)}
                                  className={`w-5 h-5 flex items-center justify-center rounded ${outcome === 'success' ? 'bg-green-500/40 text-white' : 'text-green-400 hover:bg-green-500/15'} text-[9px] font-bold transition-all`}
                                  title="Gol segnato"
                                >
                                  V
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateEventOutcome(ev.id, `${baseDetail}::fail`)}
                                  className={`w-5 h-5 flex items-center justify-center rounded ${outcome === 'fail' ? 'bg-red-500/40 text-white' : 'text-red-400 hover:bg-red-500/15'} text-[9px] font-bold transition-all`}
                                  title="Gol mancato"
                                >
                                  X
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="w-6 h-6 rounded bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center text-xs transition-colors cursor-pointer"
                              title="Elimina"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-white/40 text-xs italic py-8 text-center my-auto">
                      Nessun evento registrato per questo match.
                    </div>
                  )}
                </div>
              </div>

              {/* Form (Right 5 cols) */}
              <div className="md:col-span-5 flex flex-col gap-3">
                <span className="text-xs text-white/60 font-bold uppercase tracking-wider">Aggiungi Evento</span>
                
                <form onSubmit={handleAddEvent} className="flex flex-col gap-3.5 bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl">
                  {/* Squadra */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Squadra</label>
                    <div className="flex bg-black/20 rounded-lg p-1 border border-white/5">
                      <button
                        type="button"
                        onClick={() => { setEventTeamId(match.home_team_id); setEventPlayerId(''); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer ${eventTeamId === match.home_team_id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                      >
                        Casa
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEventTeamId(match.away_team_id); setEventPlayerId(''); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer ${eventTeamId === match.away_team_id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                      >
                        Fuori
                      </button>
                    </div>
                  </div>

                  {/* Giocatore */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Giocatore</label>
                    <select
                      value={eventPlayerId}
                      onChange={e => setEventPlayerId(e.target.value)}
                      className="bg-black/30 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-blue-500/50 w-full"
                    >
                      <option value="">-- Sconosciuto --</option>
                      {activePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  {/* Tipo Evento */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Tipo di Evento</label>
                    <select
                      value={eventType}
                      onChange={e => setEventType(e.target.value)}
                      className="bg-black/30 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-blue-500/50 w-full"
                      required
                    >
                      <option value="GOAL">⚽ Goal</option>
                      <option value="AUTOGOAL">⚽ Autogol</option>
                      <option value="ASSIST">🎯 Assist</option>
                      <option value="AMMONIZIONE">🟨 Ammonizione</option>
                      <option value="ESPULSIONE">🟥 Espulsione</option>
                      <option value="CARTA_penalty">🃏 Carta: Penalty 🎯</option>
                      <option value="CARTA_shootout">🃏 Carta: Shootout ⚡</option>
                      <option value="CARTA_suspension">🃏 Carta: Suspension ⛔</option>
                      <option value="CARTA_goalx2">🃏 Carta: Goal X2 🔥</option>
                      <option value="CARTA_starplayer">🃏 Carta: Star Player 🌟</option>
                      <option value="CARTA_joker">🃏 Carta: Joker 🃏</option>
                    </select>
                  </div>

                  {/* Minuto */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Minuto</label>
                    <input
                      type="number"
                      value={eventMinute}
                      onChange={e => setEventMinute(e.target.value)}
                      className="bg-black/30 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-blue-500/50 w-full text-center"
                      placeholder="Es: 42"
                      required
                      min="0"
                      max="120"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full justify-center py-2.5 mt-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors border border-blue-500/30 cursor-pointer shadow-[0_2px_8px_rgba(59,130,246,0.2)]"
                  >
                    Salva Evento
                  </button>
                </form>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-white/10 pt-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Chiudi
              </button>
            </div>

          </GlassEffect>
        </div>
      </div>
    </div>
  );
}
