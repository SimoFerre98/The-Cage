import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import GlassEffect from '../GlassEffect';

export default function MatchesManager() {
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [round, setRound] = useState('Girone Unico');

  const loadData = async () => {
    setLoading(true);
    const { data: tData } = await supabase.from('teams').select('id, name').order('name');
    const { data: mData } = await supabase
      .from('matches')
      .select('*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)')
      .order('match_date', { ascending: true });
    
    if (tData) setTeams(tData);
    if (mData) setMatches(mData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeamId || !awayTeamId || !matchDate || !matchTime || !round) return;
    if (homeTeamId === awayTeamId) {
      alert("Le due squadre devono essere diverse!");
      return;
    }

    // Combine date and time
    const dateTimeIso = new Date(`${matchDate}T${matchTime}`).toISOString();

    const { error } = await supabase.from('matches').insert([{
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_date: dateTimeIso,
      round: round,
      status: 'PROSSIMA',
      home_score: 0,
      away_score: 0
    }]);

    if (!error) {
      setHomeTeamId('');
      setAwayTeamId('');
      setMatchDate('');
      setMatchTime('');
      setRound('Girone Unico');
      loadData();
    } else {
      alert("Errore nell'aggiunta della partita");
    }
  };

  const handleChangeStatus = async (id: string, newStatus: string) => {
    // Se c'è già una partita LIVE, non possiamo metterne un'altra
    if (newStatus === 'LIVE') {
      const alreadyLive = matches.find(m => m.status === 'LIVE' && m.id !== id);
      if (alreadyLive) {
        alert("C'è già una partita in LIVE! Termina quella prima di iniziarne una nuova.");
        return;
      }
    }
    await supabase.from('matches').update({ status: newStatus }).eq('id', id);
    loadData();
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa partita? (Tutti gli eventi associati andranno persi)')) return;
    await supabase.from('matches').delete().eq('id', id);
    loadData();
  };

  if (loading) return <div className="text-white/60">Caricamento dati...</div>;

  return (
    <div className="flex flex-col gap-8">
      {/* Aggiungi Partita */}
      <GlassEffect className="p-8 md:p-10 rounded-[24px]">
        <h2 className="text-xl font-bold text-white mb-6 text-center uppercase tracking-wider">Nuova Partita</h2>
        <form onSubmit={handleAddMatch} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/60 font-bold uppercase tracking-wider ml-1 mb-1">Squadra Casa</label>
            <select 
              value={homeTeamId} 
              onChange={e => setHomeTeamId(e.target.value)}
              className="bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50"
              required
            >
              <option value="">-- Seleziona --</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/60 font-bold uppercase tracking-wider ml-1 mb-1">Squadra Trasferta</label>
            <select 
              value={awayTeamId} 
              onChange={e => setAwayTeamId(e.target.value)}
              className="bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50"
              required
            >
              <option value="">-- Seleziona --</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/60 font-bold uppercase tracking-wider ml-1 mb-1">Data</label>
            <input 
              type="date" 
              value={matchDate} 
              onChange={e => setMatchDate(e.target.value)}
              className="bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/60 font-bold uppercase tracking-wider ml-1 mb-1">Ora (Es: 21:00)</label>
            <input 
              type="time" 
              value={matchTime} 
              onChange={e => setMatchTime(e.target.value)}
              className="bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50"
              required
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-xs text-white/60 font-bold uppercase tracking-wider ml-1 mb-1">Turno / Girone</label>
            <input 
              type="text" 
              value={round} 
              onChange={e => setRound(e.target.value)}
              className="bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50"
              placeholder="Es: Girone A, Semifinale..."
              required
            />
          </div>
          <div className="md:col-span-2 mt-4">
            <button type="submit" className="install-btn w-full justify-center py-4">Programma Partita</button>
          </div>
        </form>
      </GlassEffect>

      {/* Lista Partite */}
      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-bold text-white mb-4 text-center uppercase tracking-wider">Calendario</h2>
        {matches.map(match => {
          const dateStr = new Date(match.match_date).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
          return (
            <GlassEffect key={match.id} className="p-8 md:p-10 rounded-[24px] flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="text-xs text-white/50 font-bold uppercase tracking-wider mb-2">
                  {dateStr} • {match.round}
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-white text-lg md:text-xl">{match.home_team?.name}</span>
                  <span className="px-3 py-1.5 rounded-xl bg-black/40 text-white/95 font-mono text-sm md:text-base border border-white/5 font-bold">
                    {match.home_score} - {match.away_score}
                  </span>
                  <span className="font-bold text-white text-lg md:text-xl">{match.away_team?.name}</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="flex bg-[rgba(0,0,0,0.3)] rounded-xl p-1 border border-white/5">
                  <button 
                    onClick={() => handleChangeStatus(match.id, 'PROSSIMA')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${match.status === 'PROSSIMA' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
                  >
                    PROSSIMA
                  </button>
                  <button 
                    onClick={() => handleChangeStatus(match.id, 'LIVE')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${match.status === 'LIVE' ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-white/50 hover:text-red-400'}`}
                  >
                    LIVE
                  </button>
                  <button 
                    onClick={() => handleChangeStatus(match.id, 'TERMINATA')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${match.status === 'TERMINATA' ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-white/50 hover:text-green-400'}`}
                  >
                    TERMINATA
                  </button>
                </div>
                
                <button 
                  onClick={() => handleDeleteMatch(match.id)}
                  className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-xl text-sm text-red-200 transition-colors flex items-center justify-center"
                  style={{ minWidth: '42px', minHeight: '42px' }}
                >
                  🗑️
                </button>
              </div>
            </GlassEffect>
          );
        })}
      </div>
    </div>
  );
}
