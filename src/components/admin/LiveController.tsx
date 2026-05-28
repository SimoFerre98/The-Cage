import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import GlassEffect from '../GlassEffect';

export default function LiveController() {
  const [liveMatch, setLiveMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [homePlayers, setHomePlayers] = useState<any[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<any[]>([]);

  // Event form state
  const [eventTeamId, setEventTeamId] = useState('');
  const [eventPlayerId, setEventPlayerId] = useState('');
  const [eventType, setEventType] = useState('GOAL');
  const [eventDetail, setEventDetail] = useState('');
  const [eventMinute, setEventMinute] = useState('');

  const loadData = async () => {
    setLoading(true);
    const { data: match } = await supabase
      .from('matches')
      .select('*, home_team:teams!home_team_id(id, name), away_team:teams!away_team_id(id, name)')
      .eq('status', 'LIVE')
      .single();

    if (match) {
      setLiveMatch(match);
      const { data: hPlayers } = await supabase.from('players').select('*').eq('team_id', match.home_team_id).order('name');
      const { data: aPlayers } = await supabase.from('players').select('*').eq('team_id', match.away_team_id).order('name');
      setHomePlayers(hPlayers || []);
      setAwayPlayers(aPlayers || []);
      
      // Default to home team for events
      if (!eventTeamId) setEventTeamId(match.home_team_id);
    } else {
      setLiveMatch(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateScore = async (homeDelta: number, awayDelta: number) => {
    if (!liveMatch) return;
    const newHome = Math.max(0, liveMatch.home_score + homeDelta);
    const newAway = Math.max(0, liveMatch.away_score + awayDelta);
    
    await supabase.from('matches').update({
      home_score: newHome,
      away_score: newAway
    }).eq('id', liveMatch.id);
    
    loadData();
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
      detail: eventDetail || null
    }]);

    if (!error) {
      setEventMinute('');
      setEventDetail('');
      alert("Evento aggiunto con successo e visibile live!");
    } else {
      alert("Errore: " + error.message);
    }
  };

  if (loading) return <div className="text-white/60">Ricerca partita in diretta...</div>;

  if (!liveMatch) return (
    <GlassEffect className="p-8 text-center rounded-2xl">
      <div className="text-4xl mb-4">📺</div>
      <h2 className="text-xl font-bold text-white mb-2">Nessuna partita LIVE</h2>
      <p className="text-white/60 mb-6">Vai nella sezione "Calendario" e imposta una partita su LIVE per iniziare la regia.</p>
    </GlassEffect>
  );

  const activePlayers = eventTeamId === liveMatch.home_team_id ? homePlayers : awayPlayers;

  return (
    <div className="flex flex-col gap-6">
      {/* Scoreboard Controller */}
      <GlassEffect className="p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
        <div className="text-center mb-6">
          <span className="bg-red-500 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            In Diretta Ora
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
          {/* Home */}
          <div className="flex flex-col items-center flex-1">
            <h3 className="text-lg md:text-xl font-bold text-white text-center mb-4">{liveMatch.home_team.name}</h3>
            <div className="flex items-center gap-4">
              <button onClick={() => updateScore(-1, 0)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xl flex items-center justify-center transition-colors">-</button>
              <div className="text-6xl font-black text-white w-16 text-center">{liveMatch.home_score}</div>
              <button onClick={() => updateScore(1, 0)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xl flex items-center justify-center transition-colors">+</button>
            </div>
          </div>

          <div className="text-4xl font-light text-white/40">:</div>

          {/* Away */}
          <div className="flex flex-col items-center flex-1">
            <h3 className="text-lg md:text-xl font-bold text-white text-center mb-4">{liveMatch.away_team.name}</h3>
            <div className="flex items-center gap-4">
              <button onClick={() => updateScore(0, -1)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xl flex items-center justify-center transition-colors">-</button>
              <div className="text-6xl font-black text-white w-16 text-center">{liveMatch.away_score}</div>
              <button onClick={() => updateScore(0, 1)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xl flex items-center justify-center transition-colors">+</button>
            </div>
          </div>
        </div>
      </GlassEffect>

      {/* Events Controller */}
      <GlassEffect className="p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Aggiungi Evento (Timeline)</h2>
        <form onSubmit={handleAddEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60 font-bold uppercase">Squadra</label>
            <div className="flex bg-[rgba(0,0,0,0.3)] rounded-lg p-1 border border-white/10">
              <button 
                type="button"
                onClick={() => { setEventTeamId(liveMatch.home_team_id); setEventPlayerId(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${eventTeamId === liveMatch.home_team_id ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
              >
                {liveMatch.home_team.name}
              </button>
              <button 
                type="button"
                onClick={() => { setEventTeamId(liveMatch.away_team_id); setEventPlayerId(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${eventTeamId === liveMatch.away_team_id ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
              >
                {liveMatch.away_team.name}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60 font-bold uppercase">Giocatore</label>
            <select 
              value={eventPlayerId} 
              onChange={e => setEventPlayerId(e.target.value)}
              className="bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-lg p-2.5 text-white outline-none h-[42px]"
              required
            >
              <option value="">-- Seleziona Giocatore --</option>
              {activePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60 font-bold uppercase">Tipo di Evento</label>
            <select 
              value={eventType} 
              onChange={e => setEventType(e.target.value)}
              className="bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-lg p-2.5 text-white outline-none"
              required
            >
              <option value="GOAL">⚽ Goal (Normale)</option>
              <option value="AMMONIZIONE">🟨 Cartellino Giallo</option>
              <option value="ESPULSIONE">🟥 Cartellino Rosso</option>
              <option value="CARTA">🃏 Carta Attivata</option>
            </select>
          </div>

          {eventType === 'CARTA' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/60 font-bold uppercase">Quale Carta?</label>
              <select 
                value={eventDetail} 
                onChange={e => setEventDetail(e.target.value)}
                className="bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-lg p-2.5 text-white outline-none border-purple-500/50"
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

          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60 font-bold uppercase">Minuto</label>
            <input 
              type="number" 
              value={eventMinute} 
              onChange={e => setEventMinute(e.target.value)}
              className="bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-lg p-2.5 text-white outline-none"
              placeholder="Es: 12"
              required
              min="0"
              max="120"
            />
          </div>

          <div className="md:col-span-2 mt-2">
            <button type="submit" className="install-btn w-full justify-center">Genera Evento Live</button>
          </div>
        </form>
      </GlassEffect>
    </div>
  );
}
