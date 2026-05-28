import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import GlassEffect from '../GlassEffect';

export default function TeamsPlayersManager() {
  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const { data: tData } = await supabase.from('teams').select('*').order('name');
    const { data: pData } = await supabase.from('players').select('*').order('name');
    if (tData) setTeams(tData);
    if (pData) setPlayers(pData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    const { error } = await supabase.from('teams').insert([{ name: newTeamName }]);
    if (!error) {
      setNewTeamName('');
      loadData();
    } else {
      alert("Errore nell'aggiunta della squadra");
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa squadra e tutti i suoi giocatori?')) return;
    await supabase.from('teams').delete().eq('id', id);
    loadData();
  };

  const handleAddPlayer = async (e: React.FormEvent, teamId: string) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    const { error } = await supabase.from('players').insert([{ name: newPlayerName, team_id: teamId }]);
    if (!error) {
      setNewPlayerName('');
      loadData();
    } else {
      alert("Errore nell'aggiunta del giocatore");
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo giocatore?')) return;
    await supabase.from('players').delete().eq('id', id);
    loadData();
  };

  if (loading) return <div className="text-white/60">Caricamento dati...</div>;

  return (
    <div className="flex flex-col gap-6">
      <GlassEffect className="p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Aggiungi Squadra</h2>
        <form onSubmit={handleAddTeam} className="flex gap-3">
          <input 
            type="text" 
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            className="flex-1 bg-[rgba(0,0,0,0.2)] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500/50"
            placeholder="Nome della squadra..."
            required
          />
          <button type="submit" className="install-btn m-0">Aggiungi</button>
        </form>
      </GlassEffect>

      <div className="flex flex-col gap-4">
        {teams.map(team => (
          <GlassEffect key={team.id} className="p-4 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between">
              <div 
                className="font-bold text-lg text-white cursor-pointer flex-1"
                onClick={() => setActiveTeamId(activeTeamId === team.id ? null : team.id)}
              >
                {team.name}
                <span className="text-xs text-white/40 ml-2">({players.filter(p => p.team_id === team.id).length} giocatori)</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTeamId(activeTeamId === team.id ? null : team.id)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/80 transition-colors"
                >
                  {activeTeamId === team.id ? 'Chiudi' : 'Gestisci'}
                </button>
                <button 
                  onClick={() => handleDeleteTeam(team.id)}
                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-lg text-sm text-red-200 transition-colors"
                >
                  Elimina
                </button>
              </div>
            </div>

            {activeTeamId === team.id && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <form onSubmit={(e) => handleAddPlayer(e, team.id)} className="flex gap-3 mb-4">
                  <input 
                    type="text" 
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="flex-1 bg-[rgba(0,0,0,0.2)] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                    placeholder="Nome giocatore..."
                    required
                  />
                  <button type="submit" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold text-white transition-colors">
                    + Giocatore
                  </button>
                </form>

                <div className="flex flex-col gap-2">
                  {players.filter(p => p.team_id === team.id).map(player => (
                    <div key={player.id} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg">
                      <span className="text-sm text-white/90">{player.name}</span>
                      <button 
                        onClick={() => handleDeletePlayer(player.id)}
                        className="text-red-400 hover:text-red-300 text-xs font-bold"
                      >
                        Rimuovi
                      </button>
                    </div>
                  ))}
                  {players.filter(p => p.team_id === team.id).length === 0 && (
                    <div className="text-white/40 text-sm italic">Nessun giocatore inserito.</div>
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
