import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import GlassEffect from '../GlassEffect';
import type { AdminChildProps, Player } from './types';

export default function LiveController({ 
  matches, 
  onRefreshMatches, 
  isDeviceOnline, 
  deviceLastSeen 
}: AdminChildProps) {
  // Deriva il match LIVE direttamente dai props — 0 query DB
  const liveMatch = matches.find(m => m.status === 'LIVE') ?? null;

  // Giocatori del match LIVE: fetch locale (dipendono dall'id del match specifico)
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  // Event form state
  const [eventTeamId, setEventTeamId] = useState('');
  const [eventPlayerId, setEventPlayerId] = useState('');
  const [eventType, setEventType] = useState('GOAL');
  const [eventMinute, setEventMinute] = useState('');

  // Modale di conferma eliminazione
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<any | null>(null);

  // Carica i giocatori solo quando cambia il match LIVE
  useEffect(() => {
    if (!liveMatch) {
      setHomePlayers([]);
      setAwayPlayers([]);
      return;
    }

    setPlayersLoading(true);
    Promise.all([
      supabase.from('players').select('*').eq('team_id', liveMatch.home_team_id).order('name'),
      supabase.from('players').select('*').eq('team_id', liveMatch.away_team_id).order('name'),
    ]).then(([{ data: hP }, { data: aP }]) => {
      setHomePlayers(hP || []);
      setAwayPlayers(aP || []);
      // Default team per gli eventi
      if (!eventTeamId) setEventTeamId(liveMatch.home_team_id);
      setPlayersLoading(false);
    });
  }, [liveMatch?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Carica gli eventi del match live
  const fetchEvents = useCallback(async () => {
    if (!liveMatch) return;
    const { data, error } = await supabase
      .from('match_events')
      .select(`
        id,
        minute,
        type,
        detail,
        player:players(name)
      `)
      .eq('match_id', liveMatch.id)
      .order('minute', { ascending: false });
    if (!error && data) {
      setEvents(data);
    }
  }, [liveMatch?.id]);

  // Carica e sottoscrivi in realtime agli eventi del match live
  useEffect(() => {
    if (!liveMatch) {
      setEvents([]);
      return;
    }

    fetchEvents();

    // Sottoscrizione non filtrata per match_id in Supabase Realtime per intercettare i DELETE (payload.old.id)
    const channel = supabase.channel(`live_controller_events_${liveMatch.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_events' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            // Su eliminazione ricarichiamo gli eventi del match corrente
            fetchEvents();
          } else if (payload.new && payload.new.match_id === liveMatch.id) {
            // Per inserimento ed aggiornamento controlliamo se appartiene al match live
            fetchEvents();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveMatch?.id, fetchEvents]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const performDeleteEvent = async (eventId: string) => {
    const previousEvents = [...events];

    // Aggiornamento ottimistico: sparisce istantaneamente (0ms latenza)
    setEvents(prev => prev.filter(ev => ev.id !== eventId));

    const { error } = await supabase
      .from('match_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      // In caso di errore ripristina lo stato precedente
      setEvents(previousEvents);
      fetchEvents();
      alert('Errore nell\'eliminazione dell\'evento: ' + error.message);
    }
  };

  const updateScore = async (homeDelta: number, awayDelta: number) => {
    if (!liveMatch) return;
    const newHome = Math.max(0, liveMatch.home_score + homeDelta);
    const newAway = Math.max(0, liveMatch.away_score + awayDelta);
    await supabase.from('matches').update({ home_score: newHome, away_score: newAway }).eq('id', liveMatch.id);
    onRefreshMatches(); // aggiorna il padre silenziosamente
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveMatch || !eventTeamId || !eventType || !eventMinute) return;

    let finalType = eventType;
    let finalDetail = null;

    if (eventType.startsWith('CARTA_')) {
      finalType = 'CARTA';
      finalDetail = eventType.replace('CARTA_', '');
    }

    const { error } = await supabase.from('match_events').insert([{
      match_id: liveMatch.id,
      team_id: eventTeamId,
      player_id: eventPlayerId || null,
      minute: parseInt(eventMinute),
      type: finalType,
      detail: finalDetail,
    }]);

    if (!error) {
      setEventMinute('');
      setEventPlayerId('');
      alert('Evento aggiunto con successo e visibile live!');
    } else {
      alert('Errore: ' + error.message);
    }
  };

  const updateEventOutcome = async (eventId: string, newDetail: string) => {
    const previousEvents = [...events];
    // Aggiornamento ottimistico
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, detail: newDetail } : e));
    
    const { error } = await supabase.from('match_events').update({ detail: newDetail }).eq('id', eventId);
    if (error) {
      setEvents(previousEvents);
      alert('Errore: ' + error.message);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const activePlayers = liveMatch 
    ? (eventTeamId === liveMatch.home_team_id ? homePlayers : awayPlayers) 
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Stato Centralina ESP32 */}
      <GlassEffect className="p-4 md:p-6 rounded-[24px] relative overflow-hidden">
        {isDeviceOnline ? (
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-green-500/10 blur-[40px] pointer-events-none" />
        ) : (
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-red-500/10 blur-[40px] pointer-events-none" />
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 z-10 relative">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
              isDeviceOnline 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-white/5 border-white/10 text-white/50'
            }`}>
              <span className="text-xl font-bold">⚡</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Centralina LED (ESP32)</h3>
              <p className="text-xs text-white/50 mt-0.5">
                {deviceLastSeen 
                  ? `Ultimo segnale: ${new Date(deviceLastSeen).toLocaleTimeString('it-IT')} (${new Date(deviceLastSeen).toLocaleDateString('it-IT')})` 
                  : 'Nessun segnale registrato'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isDeviceOnline ? (
              <span className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/35 px-4 py-2 rounded-full text-xs text-green-400 font-extrabold uppercase tracking-wider animate-[pulse_2s_infinite]">
                <span className="h-2 w-2 rounded-full bg-green-400"></span>
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-full text-xs text-red-400 font-extrabold uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                Offline
              </span>
            )}
          </div>
        </div>

        {!isDeviceOnline && (
          <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-white/40 leading-relaxed">
            💡 <strong>Troubleshooting:</strong> Se la centralina lampeggia in <span className="text-amber-400 font-bold">Arancione</span>, significa che non è connessa alla rete Wi-Fi locale. Verifica che l'ESP32 sia alimentato e che la rete "WIFI HOME" sia raggiungibile.
          </div>
        )}
      </GlassEffect>

      {!liveMatch ? (
        <GlassEffect className="p-10 md:p-12 text-center rounded-2xl">
          <div className="text-4xl mb-4">📺</div>
          <h2 className="text-xl font-bold text-white mb-4 text-center">Nessuna partita LIVE</h2>
          <p className="text-white/60 mb-6">Vai nella sezione "Calendario" e imposta una partita su LIVE per iniziare la regia.</p>
        </GlassEffect>
      ) : (
        <div className="flex flex-col gap-8 w-full">
      {/* Scoreboard Controller */}
      <GlassEffect className="p-8 md:p-10 rounded-[24px] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
        <div className="text-center mb-8">
          <span className="bg-red-500 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)]">
            In Diretta Ora
          </span>
        </div>

        {/* Mobile: colonna | Desktop: riga fianco a fianco */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full">

          {/* Home team */}
          <div className="flex flex-col items-center flex-1 w-full min-w-0">
            <h3 className="text-base md:text-xl font-bold text-white text-center mb-4 leading-tight px-2 break-words w-full">
              {liveMatch.home_team.name}
            </h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => updateScore(-1, 0)}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xl flex items-center justify-center transition-colors border border-white/5 flex-shrink-0"
              >-</button>
              <div className="text-6xl md:text-7xl font-black text-white w-16 md:w-20 text-center select-none">
                {liveMatch.home_score}
              </div>
              <button
                onClick={() => updateScore(1, 0)}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xl flex items-center justify-center transition-colors border border-white/5 flex-shrink-0"
              >+</button>
            </div>
          </div>

          <div className="text-4xl md:text-5xl font-light text-white/30 select-none flex-shrink-0">:</div>

          {/* Away team */}
          <div className="flex flex-col items-center flex-1 w-full min-w-0">
            <h3 className="text-base md:text-xl font-bold text-white text-center mb-4 leading-tight px-2 break-words w-full">
              {liveMatch.away_team.name}
            </h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => updateScore(0, -1)}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xl flex items-center justify-center transition-colors border border-white/5 flex-shrink-0"
              >-</button>
              <div className="text-6xl md:text-7xl font-black text-white w-16 md:w-20 text-center select-none">
                {liveMatch.away_score}
              </div>
              <button
                onClick={() => updateScore(0, 1)}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xl flex items-center justify-center transition-colors border border-white/5 flex-shrink-0"
              >+</button>
            </div>
          </div>

        </div>
      </GlassEffect>

      {/* Events Controller */}
      <GlassEffect className="p-8 md:p-10 rounded-[24px]">
        <h2 className="text-xl font-bold text-white mb-8 text-center uppercase tracking-wider">Aggiungi Evento (Timeline)</h2>
        {playersLoading ? (
          <div className="text-white/50 text-center py-8">Caricamento giocatori...</div>
        ) : (
          <form onSubmit={handleAddEvent} className="flex flex-col items-center gap-6 w-full">
            <div className="w-full flex flex-col items-center">
              <label className="text-xs text-white/60 font-bold uppercase tracking-wider mb-2 text-center">Squadra</label>
              <div className="w-[80%] flex bg-[rgba(0,0,0,0.3)] rounded-xl p-1.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => { setEventTeamId(liveMatch.home_team_id); setEventPlayerId(''); }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${eventTeamId === liveMatch.home_team_id ? 'bg-white/20 text-white shadow' : 'text-white/50 hover:text-white'}`}
                >
                  {liveMatch.home_team.name}
                </button>
                <button
                  type="button"
                  onClick={() => { setEventTeamId(liveMatch.away_team_id); setEventPlayerId(''); }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${eventTeamId === liveMatch.away_team_id ? 'bg-white/20 text-white shadow' : 'text-white/50 hover:text-white'}`}
                >
                  {liveMatch.away_team.name}
                </button>
              </div>
            </div>

            <div className="w-full flex flex-col items-center">
              <label className="text-xs text-white/60 font-bold uppercase tracking-wider mb-2 text-center">Giocatore</label>
              <select
                value={eventPlayerId}
                onChange={e => setEventPlayerId(e.target.value)}
                className="w-[80%] bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 h-[48px] text-center custom-select"
                style={{ textAlignLast: 'center' }}
              >
                <option value="">-- Giocatore Sconosciuto / Non Specificato --</option>
                {activePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="w-full flex flex-col items-center">
              <label className="text-xs text-white/60 font-bold uppercase tracking-wider mb-2 text-center">Tipo di Evento</label>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                className="w-[80%] bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 h-[48px] text-center custom-select"
                style={{ textAlignLast: 'center' }}
                required
              >
                <option value="GOAL">⚽ Goal (Normale)</option>
                <option value="ASSIST">🎯 Assist</option>
                <option value="AMMONIZIONE">🟨 Cartellino Giallo</option>
                <option value="ESPULSIONE">🟥 Cartellino Rosso</option>
                <option value="CARTA_penalty">🃏 Carta: Penalty 🎯</option>
                <option value="CARTA_shootout">🃏 Carta: Shootout ⚡</option>
                <option value="CARTA_suspension">🃏 Carta: Suspension ⛔</option>
                <option value="CARTA_goalx2">🃏 Carta: Goal X2 🔥</option>
                <option value="CARTA_starplayer">🃏 Carta: Star Player 🌟</option>
                <option value="CARTA_joker">🃏 Carta: Joker 🃏</option>
              </select>
            </div>

            <div className="w-full flex flex-col items-center">
              <label className="text-xs text-white/60 font-bold uppercase tracking-wider mb-2 text-center">Minuto</label>
              <input
                type="number"
                value={eventMinute}
                onChange={e => setEventMinute(e.target.value)}
                className="w-[80%] bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 h-[48px] text-center"
                placeholder="Es: 12"
                required
                min="0"
                max="120"
              />
            </div>

            <button type="submit" className="install-btn w-[80%] justify-center py-4 mt-2">Genera Evento Live</button>
          </form>
        )}
      </GlassEffect>

      {/* Regia Timeline / Cronologia Eventi */}
      <GlassEffect className="p-8 md:p-10 rounded-[24px]">
        <h2 className="text-xl font-bold text-white mb-6 text-center uppercase tracking-wider">Timeline Eventi Live</h2>
        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
          {events.length > 0 ? (
            events.map((ev, i) => {
              const emoji = ev.type === 'GOAL' ? '⚽' : ev.type === 'YELLOW_CARD' || ev.type === 'AMMONIZIONE' ? '🟨' : ev.type === 'RED_CARD' || ev.type === 'ESPULSIONE' ? '🟥' : '🃏';
              const [baseDetail, outcome] = (ev.detail || '').split('::');
              const isPenaltyOrShootout = ev.type === 'CARTA' && (baseDetail === 'penalty' || baseDetail === 'shootout');
              
              const desc = ev.type === 'GOAL' 
                ? 'Gol' 
                : ev.type === 'ASSIST' 
                  ? 'Assist' 
                  : ev.type === 'YELLOW_CARD' || ev.type === 'AMMONIZIONE' 
                    ? 'Ammonizione' 
                    : ev.type === 'RED_CARD' || ev.type === 'ESPULSIONE' 
                      ? 'Espulsione' 
                      : `Carta (${baseDetail || 'Attivata'})${outcome === 'success' ? ' ✅ Gol' : outcome === 'fail' ? ' ❌ No Gol' : ''}`;
              const playerName = ev.player?.name || 'Giocatore Sconosciuto';

              return (
                <div key={ev.id || i} className="flex items-center justify-between bg-white/5 border border-white/[0.04] p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{emoji}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{desc}</span>
                      <span className="text-xs text-white/50">{playerName} ({ev.minute}')</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPenaltyOrShootout && (
                      <div className="flex items-center gap-1 mr-2 bg-black/20 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateEventOutcome(ev.id, `${baseDetail}::success`)}
                          className={`w-7 h-7 flex items-center justify-center rounded-md ${outcome === 'success' ? 'bg-green-500/40 border-green-500 text-white' : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/25'} border text-xs font-bold transition-all`}
                          title="Gol segnato"
                        >
                          V
                        </button>
                        <button
                          type="button"
                          onClick={() => updateEventOutcome(ev.id, `${baseDetail}::fail`)}
                          className={`w-7 h-7 flex items-center justify-center rounded-md ${outcome === 'fail' ? 'bg-red-500/40 border-red-500 text-white' : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/25'} border text-xs font-bold transition-all`}
                          title="Gol mancato"
                        >
                          X
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => setConfirmDeleteEvent(ev)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      Elimina 🗑
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-white/40 text-xs italic py-8 border border-white/5 bg-black/10 rounded-xl">
              Nessun evento registrato per questo match.
            </div>
          )}
        </div>
      </GlassEffect>
      </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmDeleteEvent && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteEvent(null)} style={{ zIndex: 99999 }}>
          <div className="w-full max-w-[400px] px-4" onClick={e => e.stopPropagation()}>
            <GlassEffect
              className="w-full rounded-[28px] p-6 md:p-8 relative overflow-hidden text-center"
              contentClassName="flex flex-col items-center"
              style={{ display: 'block' }}
            >
              {/* Ambient background glows */}
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[rgba(239,68,68,0.25)] blur-[40px] pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[rgba(139,92,246,0.2)] blur-[40px] pointer-events-none" />

              {/* Icon header */}
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 z-10 relative">
                <span className="text-3xl text-red-500">🗑️</span>
              </div>

              <h3 className="text-xl font-extrabold tracking-tight text-white mb-3 z-10 relative">
                Elimina Evento
              </h3>

              {/* Event Summary Card */}
              <div className="w-full bg-white/5 border border-white/[0.04] p-4 rounded-xl mb-4 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] z-10 relative">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {confirmDeleteEvent.type === 'GOAL' 
                      ? '⚽' 
                      : confirmDeleteEvent.type === 'ASSIST' 
                        ? '🎯' 
                        : confirmDeleteEvent.type === 'YELLOW_CARD' || confirmDeleteEvent.type === 'AMMONIZIONE' 
                          ? '🟨' 
                          : confirmDeleteEvent.type === 'RED_CARD' || confirmDeleteEvent.type === 'ESPULSIONE' 
                            ? '🟥' 
                            : '🃏'}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">
                      {(() => {
                        const [baseDetail] = (confirmDeleteEvent.detail || '').split('::');
                        return confirmDeleteEvent.type === 'GOAL' 
                        ? 'Gol' 
                        : confirmDeleteEvent.type === 'ASSIST' 
                          ? 'Assist' 
                          : confirmDeleteEvent.type === 'YELLOW_CARD' || confirmDeleteEvent.type === 'AMMONIZIONE' 
                            ? 'Ammonizione' 
                            : confirmDeleteEvent.type === 'RED_CARD' || confirmDeleteEvent.type === 'ESPULSIONE' 
                              ? 'Espulsione' 
                              : `Carta (${baseDetail || 'Attivata'})`;
                      })()}
                    </span>
                    <span className="text-xs text-white/50">
                      {confirmDeleteEvent.player?.name || 'Giocatore Sconosciuto'} ({confirmDeleteEvent.minute}')
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-white/70 mb-6 px-1 z-10 relative leading-relaxed">
                Sei sicuro di voler eliminare questo evento dalla timeline?
                {confirmDeleteEvent.type === 'GOAL' && (
                  <span className="block mt-3 text-xs text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg leading-normal">
                    ⚠️ Se elimini un gol, ricordati di aggiornare il punteggio del match manualmente.
                  </span>
                )}
              </p>

              <div className="flex gap-3 justify-center w-full z-10 relative">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteEvent(null)}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = confirmDeleteEvent.id;
                    setConfirmDeleteEvent(null);
                    performDeleteEvent(id);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  Elimina
                </button>
              </div>
            </GlassEffect>
          </div>
        </div>
      )}
    </div>
  );
}
