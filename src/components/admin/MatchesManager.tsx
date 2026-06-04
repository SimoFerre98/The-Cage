import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import GlassEffect from '../GlassEffect';
import type { AdminChildProps } from './types';

export default function MatchesManager({ teams, matches, onRefreshMatches }: AdminChildProps) {
  // Form state
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [round, setRound] = useState('Girone Unico');

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeamId || !awayTeamId || !matchDate || !matchTime || !round) return;
    if (homeTeamId === awayTeamId) {
      alert('Le due squadre devono essere diverse!');
      return;
    }

    const dateTimeIso = new Date(`${matchDate}T${matchTime}`).toISOString();
    const { error } = await supabase.from('matches').insert([{
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_date: dateTimeIso,
      round,
      status: 'PROSSIMA',
      home_score: 0,
      away_score: 0,
    }]);

    if (!error) {
      setHomeTeamId('');
      setAwayTeamId('');
      setMatchDate('');
      setMatchTime('');
      setRound('Girone Unico');
      onRefreshMatches(); // silent refresh
    } else {
      alert("Errore nell'aggiunta della partita: " + error.message);
    }
  };

  const handleChangeStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'LIVE') {
      const alreadyLive = matches.find(m => m.status === 'LIVE' && m.id !== id);
      if (alreadyLive) {
        alert("C'è già una partita in LIVE! Termina quella prima di iniziarne una nuova.");
        return;
      }
    }
    // Optimistic UI: aggiorna subito localmente, poi scrive sul DB
    await supabase.from('matches').update({ status: newStatus }).eq('id', id);
    onRefreshMatches();
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa partita? (Tutti gli eventi associati andranno persi)')) return;
    await supabase.from('matches').delete().eq('id', id);
    onRefreshMatches();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">
      {/* Aggiungi Partita */}
      <GlassEffect className="p-8 md:p-10 rounded-[24px]">
        <h2 className="text-xl font-bold text-white mb-6 text-center uppercase tracking-wider">Nuova Partita</h2>
        <form onSubmit={handleAddMatch} className="flex flex-col items-center gap-6 w-full">
          <div className="w-full flex flex-col items-center">
            <label className="text-xs text-white/60 font-bold uppercase tracking-wider mb-2 text-center">Squadra Casa</label>
            <select
              value={homeTeamId}
              onChange={e => setHomeTeamId(e.target.value)}
              className="w-[80%] bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 text-center custom-select"
              style={{ textAlignLast: 'center' }}
              required
            >
              <option value="">-- Seleziona --</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="w-full flex flex-col items-center">
            <label className="text-xs text-white/60 font-bold uppercase tracking-wider mb-2 text-center">Squadra Trasferta</label>
            <select
              value={awayTeamId}
              onChange={e => setAwayTeamId(e.target.value)}
              className="w-[80%] bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 text-center custom-select"
              style={{ textAlignLast: 'center' }}
              required
            >
              <option value="">-- Seleziona --</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="w-full flex flex-col items-center">
            <label className="text-xs text-white/60 font-bold uppercase tracking-wider mb-2 text-center">Data</label>
            <input
              type="date"
              value={matchDate}
              onChange={e => setMatchDate(e.target.value)}
              className="w-[80%] bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 text-center"
              required
            />
          </div>
          <div className="w-full flex flex-col items-center">
            <label className="text-xs text-white/60 font-bold uppercase tracking-wider mb-2 text-center">Ora (Es: 21:00)</label>
            <input
              type="time"
              value={matchTime}
              onChange={e => setMatchTime(e.target.value)}
              className="w-[80%] bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 text-center"
              required
            />
          </div>
          <div className="w-full flex flex-col items-center">
            <label className="text-xs text-white/60 font-bold uppercase tracking-wider mb-2 text-center">Turno / Girone</label>
            <input
              type="text"
              value={round}
              onChange={e => setRound(e.target.value)}
              className="w-[80%] bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 text-center"
              placeholder="Es: Girone A, Semifinale..."
              required
            />
          </div>
          <button type="submit" className="install-btn w-[80%] justify-center py-4 mt-2">Programma Partita</button>
        </form>
      </GlassEffect>

      {/* Lista Partite */}
      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-bold text-white mb-4 text-center uppercase tracking-wider">Calendario</h2>
        {matches.map(match => {
          const dateStr = new Date(match.match_date).toLocaleString('it-IT', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
          });
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
