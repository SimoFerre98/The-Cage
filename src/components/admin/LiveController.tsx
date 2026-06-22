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

  // --- GESTIONE TIMER CENTRALINA ---
  const [dbTimer, setDbTimer] = useState<{
    command: 'START' | 'PAUSE' | 'STOP';
    duration: number;
    updated_at: string;
  } | null>(null);
  const [displaySeconds, setDisplaySeconds] = useState<number>(9);
  const [selectedDuration, setSelectedDuration] = useState<number>(9);
  const [timerLoading, setTimerLoading] = useState<boolean>(false);

  const [inputMins, setInputMins] = useState<number>(0);
  const [inputSecs, setInputSecs] = useState<number>(9);

  // Caricamento dello stato iniziale e sottoscrizione realtime
  useEffect(() => {
    supabase
      .from('timer_control')
      .select('*')
      .eq('id', 'timer_1')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const rec = data as { command: 'START' | 'PAUSE' | 'STOP'; duration: number; updated_at: string };
          setDbTimer(rec);
          setSelectedDuration(rec.duration);
        }
      });

    const channel = supabase
      .channel('timer_control_sync')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'timer_control' },
        (payload) => {
          if (payload.new && (payload.new as any).id === 'timer_1') {
            const record = payload.new as { id: string; command: 'START' | 'PAUSE' | 'STOP'; duration: number; updated_at: string };
            setDbTimer(record);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Countdown locale non-drift basato su Date.now() e updated_at
  useEffect(() => {
    if (!dbTimer) return;

    if (dbTimer.command === 'START') {
      const calculateRemaining = () => {
        const elapsedMs = Date.now() - new Date(dbTimer.updated_at).getTime();
        const elapsedSecs = Math.floor(elapsedMs / 1000);
        const rem = Math.max(0, dbTimer.duration - elapsedSecs);
        setDisplaySeconds(rem);
      };

      calculateRemaining();
      const interval = setInterval(calculateRemaining, 1000);
      return () => clearInterval(interval);
    } else if (dbTimer.command === 'PAUSE') {
      setDisplaySeconds(dbTimer.duration);
    } else { // STOP
      setDisplaySeconds(selectedDuration);
    }
  }, [dbTimer, selectedDuration]);

  // Sincronizza gli input numerici quando cambia la durata selezionata e lo stato è STOP
  useEffect(() => {
    if (dbTimer?.command === 'STOP') {
      setInputMins(Math.floor(selectedDuration / 60));
      setInputSecs(selectedDuration % 60);
    }
  }, [selectedDuration, dbTimer?.command]);

  const handleStartTimer = async () => {
    setTimerLoading(true);
    // Se siamo in pausa, ripartiamo dai secondi correnti sul display. Altrimenti dalla durata base.
    const targetDuration = dbTimer?.command === 'PAUSE' ? displaySeconds : selectedDuration;
    const { error } = await supabase
      .from('timer_control')
      .update({ command: 'START', duration: targetDuration })
      .eq('id', 'timer_1');
    setTimerLoading(false);
    if (error) {
      alert('Errore nell\'avvio del timer: ' + error.message);
    }
  };

  const handlePauseTimer = async () => {
    setTimerLoading(true);
    const { error } = await supabase
      .from('timer_control')
      .update({ command: 'PAUSE', duration: displaySeconds })
      .eq('id', 'timer_1');
    setTimerLoading(false);
    if (error) {
      alert('Errore nella pausa del timer: ' + error.message);
    }
  };

  const handleStopTimer = async () => {
    setTimerLoading(true);
    const { error } = await supabase
      .from('timer_control')
      .update({ command: 'STOP', duration: selectedDuration })
      .eq('id', 'timer_1');
    setTimerLoading(false);
    if (error) {
      alert('Errore nell\'arresto del timer: ' + error.message);
    }
  };

  const handleModifyTime = async (secondsToAdd: number) => {
    if (!dbTimer) return;
    
    // Calcoliamo i secondi rimanenti
    let currentRemaining = displaySeconds;
    if (dbTimer.command === 'START') {
      const elapsedMs = Date.now() - new Date(dbTimer.updated_at).getTime();
      const elapsedSecs = Math.floor(elapsedMs / 1000);
      currentRemaining = Math.max(0, dbTimer.duration - elapsedSecs);
    }

    const newRemaining = Math.max(0, currentRemaining + secondsToAdd);

    setTimerLoading(true);
    if (dbTimer.command === 'START') {
      const { error } = await supabase
        .from('timer_control')
        .update({ duration: newRemaining })
        .eq('id', 'timer_1');
      if (error) alert('Errore nella modifica del tempo: ' + error.message);
    } else if (dbTimer.command === 'PAUSE') {
      const { error } = await supabase
        .from('timer_control')
        .update({ duration: newRemaining })
        .eq('id', 'timer_1');
      if (error) alert('Errore nella modifica del tempo: ' + error.message);
    } else {
      // STOP
      setSelectedDuration(prev => Math.max(0, prev + secondsToAdd));
    }
    setTimerLoading(false);
  };

  const handleSelectPreset = async (seconds: number) => {
    setSelectedDuration(seconds);
    if (dbTimer?.command === 'STOP') {
      setTimerLoading(true);
      const { error } = await supabase
        .from('timer_control')
        .update({ duration: seconds })
        .eq('id', 'timer_1');
      setTimerLoading(false);
      if (error) alert('Errore nell\'impostazione della durata: ' + error.message);
    }
  };

  const handleSetCustomTime = async () => {
    const total = inputMins * 60 + inputSecs;
    setSelectedDuration(total);
    if (dbTimer?.command === 'STOP') {
      setTimerLoading(true);
      const { error } = await supabase
        .from('timer_control')
        .update({ duration: total })
        .eq('id', 'timer_1');
      setTimerLoading(false);
      if (error) alert('Errore nell\'impostazione del tempo: ' + error.message);
    } else {
      // Se il timer è attivo o in pausa, modifichiamo direttamente lo stato sul database
      setTimerLoading(true);
      const { error } = await supabase
        .from('timer_control')
        .update({ duration: total })
        .eq('id', 'timer_1');
      setTimerLoading(false);
      if (error) alert('Errore nella modifica del tempo: ' + error.message);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


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
    const uniqueChannelName = `live_controller_events_${liveMatch.id}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase.channel(uniqueChannelName)
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

        <div className="flex flex-col items-center gap-4 z-10 relative">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
              isDeviceOnline 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-white/5 border-white/10 text-white/50'
            }`}>
              <span className="text-xl font-bold">⚡</span>
            </div>
            <div className="text-center">
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

        {/* Legenda LED */}
        <details className="mt-4 pt-3 border-t border-white/5 text-xs text-white/60 cursor-pointer select-none">
          <summary className="font-bold hover:text-white transition-colors text-center">🔍 Legenda LED di Bordo (Diagnostica)</summary>
          <div className="flex flex-col items-center gap-2 mt-3 text-[11px] leading-relaxed">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-pulse flex-shrink-0"></span>
              <span><strong>Giallo Lampeggiante</strong>: Connessione Wi-Fi...</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500 flex-shrink-0"></span>
              <span><strong>Arancione Fisso</strong>: Attesa risposta Supabase...</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500 flex-shrink-0"></span>
              <span><strong>Viola Pulsante</strong>: Pronto (Idle)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 flex-shrink-0"></span>
              <span><strong>Verde Scorrimento</strong>: Partita LIVE agganciata</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse flex-shrink-0"></span>
              <span><strong>Arancione Lampeggiante</strong>: Errore rete (Riconnessione...)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0"></span>
              <span><strong>Rosso/Blu Strobe</strong>: Segnalazione Gol (Casa/Trasferta)</span>
            </div>
          </div>
        </details>

      </GlassEffect>

      {/* Gestione Timer */}
      <GlassEffect className="p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/60" />
        
        <div className="flex flex-col items-center gap-6">
          <div className="text-center w-full">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2">
              ⏰ Gestione Timer Carte / Effetti
            </h3>
            <p className="text-xs text-white/50 mt-1">
              Controlla il display a 7 segmenti della centralina per attivare i countdown degli effetti speciali.
            </p>
            
            <div className="flex flex-col items-center gap-4 mt-6">
              {/* OROLOGIO DIGITALE NEON */}
              <div className="flex flex-col items-center bg-black/60 border border-white/10 rounded-[20px] px-8 py-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] min-w-[200px] relative overflow-hidden">
                <div className="absolute top-1.5 right-2 flex gap-1">
                  {dbTimer?.command === 'START' && (
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
                  )}
                  {dbTimer?.command === 'PAUSE' && (
                    <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                  )}
                  {dbTimer?.command === 'STOP' && (
                    <span className="h-2 w-2 rounded-full bg-white/20"></span>
                  )}
                </div>
                <div className="font-mono text-5xl md:text-6xl font-bold tracking-widest text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)] select-none">
                  {formatTime(displaySeconds)}
                </div>
                <div className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">
                  {dbTimer?.command === 'START' ? 'In Corso' : dbTimer?.command === 'PAUSE' ? 'In Pausa' : 'Inattivo'}
                </div>
              </div>
            </div>
          </div>

          {/* PULSANTI DI TIMING PRINCIPALI */}
          <div className="flex flex-wrap justify-center gap-3 w-full">
            {dbTimer?.command !== 'START' ? (
              <button
                type="button"
                onClick={handleStartTimer}
                disabled={timerLoading}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-extrabold rounded-xl transition-all shadow-[0_0_12px_rgba(22,163,74,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm"
              >
                <span>▶️</span> {dbTimer?.command === 'PAUSE' ? 'Riprendi' : 'Avvia'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePauseTimer}
                disabled={timerLoading}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-extrabold rounded-xl transition-all shadow-[0_0_12px_rgba(202,138,4,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm"
              >
                <span>⏸️</span> Pausa
              </button>
            )}
            
            <button
              type="button"
              onClick={handleStopTimer}
              disabled={timerLoading || dbTimer?.command === 'STOP'}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-200 disabled:opacity-30 font-extrabold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm"
            >
              <span>⏹️</span> Reset / Spegni
            </button>
          </div>

          {/* MODIFICATORI TEMPO AL VOLO */}
          <div className="flex flex-col items-center gap-1.5 w-full border-t border-white/5 pt-4">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Modificatori al volo</span>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => handleModifyTime(-60)}
                disabled={timerLoading || displaySeconds < 60}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-30"
              >
                -1m
              </button>
              <button
                type="button"
                onClick={() => handleModifyTime(-10)}
                disabled={timerLoading || displaySeconds < 10}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-30"
              >
                -10s
              </button>
              <button
                type="button"
                onClick={() => handleModifyTime(10)}
                disabled={timerLoading}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                +10s
              </button>
              <button
                type="button"
                onClick={() => handleModifyTime(60)}
                disabled={timerLoading}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                +1m
              </button>
            </div>
          </div>

          {/* PRESET CARTE SPECIALI */}
          <div className="flex flex-col items-center gap-1.5 w-full border-t border-white/5 pt-4">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Preset Rapidi Carte</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-md">
              <button
                type="button"
                onClick={() => handleSelectPreset(30)}
                disabled={timerLoading}
                className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedDuration === 30
                    ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                🃏 Joker (30s)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(180)}
                disabled={timerLoading}
                className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedDuration === 180 && dbTimer?.command === 'STOP' // simple highlight
                    ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                🌟 Stella (3m)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(180)}
                disabled={timerLoading}
                className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedDuration === 180 && dbTimer?.command === 'STOP'
                    ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                🔥 Goal X2 (3m)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(180)}
                disabled={timerLoading}
                className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedDuration === 180 && dbTimer?.command === 'STOP'
                    ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                ⛔ Sosp. (3m)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(15)}
                disabled={timerLoading}
                className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedDuration === 15 && dbTimer?.command === 'STOP'
                    ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                ⚡ Shootout (15s)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(15)}
                disabled={timerLoading}
                className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedDuration === 15 && dbTimer?.command === 'STOP'
                    ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                🎯 Rigore (15s)
              </button>
            </div>
          </div>

          {/* IMPOSTAZIONE MANUALE TEMPO */}
          <div className="flex flex-col items-center gap-2 w-full border-t border-white/5 pt-4">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Impostazione manuale</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-2 py-1 w-20">
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={inputMins}
                  onChange={(e) => setInputMins(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
                  className="bg-transparent text-white text-sm font-bold text-center w-full outline-none"
                  placeholder="Min"
                />
                <span className="text-white/40 text-xs font-bold pr-1">m</span>
              </div>
              <span className="text-white/40 font-bold">:</span>
              <div className="flex items-center bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-2 py-1 w-20">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputSecs}
                  onChange={(e) => setInputSecs(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="bg-transparent text-white text-sm font-bold text-center w-full outline-none"
                  placeholder="Sec"
                />
                <span className="text-white/40 text-xs font-bold pr-1">s</span>
              </div>
              <button
                type="button"
                onClick={handleSetCustomTime}
                disabled={timerLoading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Applica
              </button>
            </div>
          </div>
        </div>
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
