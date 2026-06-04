import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import GlassEffect from '../GlassEffect';
import type { AdminChildProps } from './types';

export default function TeamsPlayersManager({ teams, players, onRefreshTeams }: AdminChildProps) {
  const [newTeamName, setNewTeamName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    const { error } = await supabase.from('teams').insert([{ name: newTeamName.trim() }]);
    if (!error) {
      setNewTeamName('');
      onRefreshTeams(); // silent refresh — nessun loading screen
    } else {
      alert("Errore nell'aggiunta della squadra: " + error.message);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa squadra e tutti i suoi giocatori?')) return;
    await supabase.from('teams').delete().eq('id', id);
    if (activeTeamId === id) setActiveTeamId(null);
    onRefreshTeams();
  };

  const handleAddPlayer = async (e: React.FormEvent, teamId: string) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    const { error } = await supabase.from('players').insert([{ name: newPlayerName.trim(), team_id: teamId }]);
    if (!error) {
      setNewPlayerName('');
      onRefreshTeams();
    } else {
      alert("Errore nell'aggiunta del giocatore: " + error.message);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo giocatore?')) return;
    await supabase.from('players').delete().eq('id', id);
    onRefreshTeams();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">
      <GlassEffect className="p-8 md:p-10 rounded-[24px]">
        <h2 className="text-xl font-bold text-white mb-6 text-center uppercase tracking-wider">Aggiungi Squadra</h2>
        <form onSubmit={handleAddTeam} className="flex flex-col items-center gap-4 w-full">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            className="w-[80%] bg-[rgba(0,0,0,0.2)] border border-white/10 rounded-xl px-5 py-3.5 text-white outline-none focus:border-blue-500/50 text-center"
            placeholder="Nome della squadra..."
            required
          />
          <button type="submit" className="install-btn w-[80%] justify-center py-3.5 mt-2">Aggiungi Squadra</button>
        </form>
      </GlassEffect>

      <div className="flex flex-col gap-6">
        {teams.map(team => (
          <GlassEffect key={team.id} className="p-8 md:p-10 rounded-[24px] overflow-hidden">
            <div className="flex items-center justify-between">
              <div
                className="font-bold text-lg md:text-xl text-white cursor-pointer flex-1"
                onClick={() => setActiveTeamId(activeTeamId === team.id ? null : team.id)}
              >
                {team.name}
                <span className="text-xs md:text-sm text-white/40 ml-3 font-normal">
                  ({players.filter(p => p.team_id === team.id).length} giocatori)
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTeamId(activeTeamId === team.id ? null : team.id)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-white/80 transition-colors font-bold border border-white/5"
                >
                  {activeTeamId === team.id ? 'Chiudi' : 'Gestisci'}
                </button>
                <button
                  onClick={() => handleDeleteTeam(team.id)}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-xl text-sm text-red-200 transition-colors font-bold"
                >
                  Elimina
                </button>
              </div>
            </div>

            {activeTeamId === team.id && (
              <div className="mt-8 pt-8 border-t border-white/10">
                <form onSubmit={(e) => handleAddPlayer(e, team.id)} className="flex gap-4 mb-6">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="flex-1 bg-[rgba(0,0,0,0.2)] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50"
                    placeholder="Nome giocatore..."
                    required
                  />
                  <button type="submit" className="px-5 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-bold text-white transition-colors">
                    + Giocatore
                  </button>
                </form>

                <div className="flex flex-col gap-3">
                  {players.filter(p => p.team_id === team.id).map(player => (
                    <div key={player.id} className="flex items-center justify-between bg-white/5 px-5 py-4 rounded-xl border border-white/[0.03]">
                      <span className="text-sm font-medium text-white/90">{player.name}</span>
                      <button
                        onClick={() => handleDeletePlayer(player.id)}
                        className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                      >
                        Rimuovi
                      </button>
                    </div>
                  ))}
                  {players.filter(p => p.team_id === team.id).length === 0 && (
                    <div className="text-white/40 text-sm italic py-2 text-center">Nessun giocatore inserito.</div>
                  )}
                </div>
              </div>
            )}
          </GlassEffect>
        ))}
      </div>
    </div>
  );
}
