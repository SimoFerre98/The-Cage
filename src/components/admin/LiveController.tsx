import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import GlassEffect from '../GlassEffect';
import type { AdminChildProps, Player } from './types';

export default function LiveController({ matches, onRefreshMatches }: AdminChildProps) {
  // Deriva il match LIVE direttamente dai props — 0 query DB
  const liveMatch = matches.find(m => m.status === 'LIVE') ?? null;

  // Giocatori del match LIVE: fetch locale (dipendono dall'id del match specifico)
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);

  // Event form state
  const [eventTeamId, setEventTeamId] = useState('');
  const [eventPlayerId, setEventPlayerId] = useState('');
  const [eventType, setEventType] = useState('GOAL');
  const [eventDetail, setEventDetail] = useState('');
  const [eventMinute, setEventMinute] = useState('');

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

  // ── Handlers ─────────────────────────────────────────────────────────────

  const updateScore = async (homeDelta: number, awayDelta: number) => {
    if (!liveMatch) return;
    const newHome = Math.max(0, liveMatch.home_score + homeDelta);
    const newAway = Math.max(0, liveMatch.away_score + awayDelta);
    await supabase.from('matches').update({ home_score: newHome, away_score: newAway }).eq('id', liveMatch.id);
    onRefreshMatches(); // aggiorna il padre silenziosamente
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveMatch || !eventTeamId || !eventPlayerId || !eventType || !eventMinute) return;

    const { error } = await supabase.from('match_events').insert([{
      match_id: liveMatch.id,
      team_id: eventTeamId,
      player_id: eventPlayerId,
      minute: parseInt(eventMinute),
      type: eventType,
      detail: eventDetail || null,
    }]);

    if (!error) {
      setEventMinute('');
      setEventDetail('');
      alert('Evento aggiunto con successo e visibile live!');
    } else {
      alert('Errore: ' + error.message);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!liveMatch) {
    return (
      <GlassEffect className="p-10 md:p-12 text-center rounded-2xl">
        <div className="text-4xl mb-4">📺</div>
        <h2 className="text-xl font-bold text-white mb-4 text-center">Nessuna partita LIVE</h2>
        <p className="text-white/60 mb-6">Vai nella sezione "Calendario" e imposta una partita su LIVE per iniziare la regia.</p>
      </GlassEffect>
    );
  }

  const activePlayers = eventTeamId === liveMatch.home_team_id ? homePlayers : awayPlayers;

  return (
    <div className="flex flex-col gap-8">
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
                required
              >
                <option value="">-- Seleziona Giocatore --</option>
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
                <option value="AMMONIZIONE">🟨 Cartellino Giallo</option>
                <option value="ESPULSIONE">🟥 Cartellino Rosso</option>
                <option value="CARTA">🃏 Carta Attivata</option>
              </select>
            </div>

            {eventType === 'CARTA' && (
              <div className="w-full flex flex-col items-center">
                <label className="text-xs text-white/60 font-bold uppercase tracking-wider mb-2 text-center">Quale Carta?</label>
                <select
                  value={eventDetail}
                  onChange={e => setEventDetail(e.target.value)}
                  className="w-[80%] bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-4 py-3 text-white outline-none border-purple-500/50 focus:border-purple-500 h-[48px] text-center custom-select"
                  style={{ textAlignLast: 'center' }}
                  required
                >
                  <option value="">-- Seleziona Carta --</option>
                  <option value="penalty">Penalty 🎯</option>
                  <option value="shootout">Shootout ⚡</option>
                  <option value="suspension">Suspension ⛔</option>
                  <option value="goalx2">Goal X2 🔥</option>
                  <option value="starplayer">Star Player 🌟</option>
                  <option value="joker">Joker 🃏</option>
                </select>
              </div>
            )}

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
    </div>
  );
}
