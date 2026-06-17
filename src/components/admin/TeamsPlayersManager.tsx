import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import GlassEffect from '../GlassEffect';
import type { AdminChildProps } from './types';
import ConfirmModal from './ConfirmModal';

const ROLE_ORDER: Record<string, number> = {
  'portiere': 1,
  'difensore': 2,
  'centrocampista': 3,
  'attaccante': 4
};

const getRoleBadge = (role: string) => {
  if (!role) return null;
  const normalized = role.toLowerCase();
  
  let config = {
    label: 'Giocatore',
    icon: '🏃',
    bg: 'bg-white/5',
    text: 'text-white/60',
    border: 'border-white/10'
  };
  
  if (normalized === 'portiere') {
    config = {
      label: 'Portiere',
      icon: '🧤',
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      border: 'border-orange-500/20'
    };
  } else if (normalized === 'difensore') {
    config = {
      label: 'Difensore',
      icon: '🛡️',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20'
    };
  } else if (normalized === 'centrocampista') {
    config = {
      label: 'Centrocampista',
      icon: '🪄',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/20'
    };
  } else if (normalized === 'attaccante') {
    config = {
      label: 'Attaccante',
      icon: '⚡',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20'
    };
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border shadow-sm ${config.bg} ${config.text} ${config.border}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default function TeamsPlayersManager({ teams, players, onRefreshTeams }: AdminChildProps) {
  const [newTeamName, setNewTeamName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState('');
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState('');

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'team' | 'player' | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const toggleManageTeam = (team: any) => {
    if (activeTeamId === team.id) {
      setActiveTeamId(null);
      setEditTeamName('');
    } else {
      setActiveTeamId(team.id);
      setEditTeamName(team.name);
    }
  };

  const handleEditTeamName = async (e: React.FormEvent, teamId: string) => {
    e.preventDefault();
    if (!editTeamName.trim()) return;
    const { error } = await supabase
      .from('teams')
      .update({ name: editTeamName.trim() })
      .eq('id', teamId);
      
    if (!error) {
      onRefreshTeams();
    } else {
      alert("Errore nella modifica del nome della squadra: " + error.message);
    }
  };

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

  const requestDeleteTeam = (id: string) => {
    setIdToDelete(id);
    setDeleteType('team');
    setConfirmOpen(true);
  };

  const requestDeletePlayer = (id: string) => {
    setIdToDelete(id);
    setDeleteType('player');
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!idToDelete) return;
    if (deleteType === 'team') {
      await supabase.from('teams').delete().eq('id', idToDelete);
      if (activeTeamId === idToDelete) setActiveTeamId(null);
      onRefreshTeams();
    } else if (deleteType === 'player') {
      await supabase.from('players').delete().eq('id', idToDelete);
      onRefreshTeams();
    }
    setConfirmOpen(false);
    setIdToDelete(null);
    setDeleteType(null);
  };

  const handleUpdatePlayerRole = async (playerId: string, role: string) => {
    const roleValue = role === '' ? null : role;
    const { error } = await supabase
      .from('players')
      .update({ role: roleValue })
      .eq('id', playerId);
      
    if (!error) {
      onRefreshTeams();
    } else {
      alert("Errore nella modifica del ruolo del giocatore: " + error.message);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent, teamId: string) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    const insertData: any = { name: newPlayerName.trim(), team_id: teamId };
    if (newPlayerRole) {
      insertData.role = newPlayerRole;
    }
    const { error } = await supabase.from('players').insert([insertData]);
    if (!error) {
      setNewPlayerName('');
      setNewPlayerRole('');
      onRefreshTeams();
    } else {
      alert("Errore nell'aggiunta del giocatore: " + error.message);
    }
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
                onClick={() => toggleManageTeam(team)}
              >
                {team.name}
                <span className="text-xs md:text-sm text-white/40 ml-3 font-normal">
                  ({players.filter(p => p.team_id === team.id).length} giocatori)
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => toggleManageTeam(team)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-white/80 transition-colors font-bold border border-white/5"
                >
                  {activeTeamId === team.id ? 'Chiudi' : 'Gestisci'}
                </button>
                <button
                  onClick={() => requestDeleteTeam(team.id)}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-xl text-sm text-red-200 transition-colors font-bold"
                >
                  Elimina
                </button>
              </div>
            </div>

            {activeTeamId === team.id && (
              <div className="mt-8 pt-8 border-t border-white/10 flex flex-col gap-6">
                {/* Rinomina Squadra */}
                <form onSubmit={(e) => handleEditTeamName(e, team.id)} className="flex gap-4 pb-6 border-b border-white/10">
                  <input
                    type="text"
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                    className="flex-1 bg-[rgba(0,0,0,0.2)] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50"
                    placeholder="Nuovo nome squadra..."
                    required
                  />
                  <button type="submit" className="px-5 py-3 bg-green-500 hover:bg-green-600 rounded-xl text-sm font-bold text-white transition-colors">
                    Rinomina
                  </button>
                </form>

                {/* Aggiungi Giocatore */}
                <form onSubmit={(e) => handleAddPlayer(e, team.id)} className="flex flex-col md:flex-row gap-4 mb-2">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="flex-1 bg-[rgba(0,0,0,0.2)] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50"
                    placeholder="Nome giocatore..."
                    required
                  />
                  <select
                    value={newPlayerRole}
                    onChange={(e) => setNewPlayerRole(e.target.value)}
                    className="bg-[rgba(0,0,0,0.2)] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50"
                  >
                    <option value="" className="bg-neutral-900 text-white/55">Seleziona Ruolo (Opzionale)</option>
                    <option value="portiere" className="bg-neutral-900 text-white">Portiere</option>
                    <option value="difensore" className="bg-neutral-900 text-white">Difensore</option>
                    <option value="centrocampista" className="bg-neutral-900 text-white">Centrocampista</option>
                    <option value="attaccante" className="bg-neutral-900 text-white">Attaccante</option>
                  </select>
                  <button type="submit" className="px-5 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-bold text-white transition-colors whitespace-nowrap">
                    + Giocatore
                  </button>
                </form>

                <div className="flex flex-col gap-3">
                  {players
                    .filter(p => p.team_id === team.id)
                    .sort((a, b) => {
                      const orderA = ROLE_ORDER[a.role || ''] || 5;
                      const orderB = ROLE_ORDER[b.role || ''] || 5;
                      if (orderA !== orderB) return orderA - orderB;
                      return a.name.localeCompare(b.name);
                    })
                    .map(player => (
                      <div key={player.id} className="flex items-center justify-between bg-white/5 px-5 py-4 rounded-xl border border-white/[0.03]">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-white/90">{player.name}</span>
                          {getRoleBadge(player.role || '')}
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            value={player.role || ''}
                            onChange={(e) => handleUpdatePlayerRole(player.id, e.target.value)}
                            className="bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/80 outline-none focus:border-blue-500/50 cursor-pointer"
                          >
                            <option value="" className="bg-neutral-900 text-white/50">Nessun ruolo</option>
                            <option value="portiere" className="bg-neutral-900 text-white">Portiere</option>
                            <option value="difensore" className="bg-neutral-900 text-white">Difensore</option>
                            <option value="centrocampista" className="bg-neutral-900 text-white">Centrocampista</option>
                            <option value="attaccante" className="bg-neutral-900 text-white">Attaccante</option>
                          </select>
                          <button
                            onClick={() => requestDeletePlayer(player.id)}
                            className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                          >
                            Rimuovi
                          </button>
                        </div>
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

      <ConfirmModal
        isOpen={confirmOpen}
        title={deleteType === 'team' ? "Elimina Squadra" : "Elimina Giocatore"}
        message={
          deleteType === 'team'
            ? "Sei sicuro di voler eliminare questa squadra e tutti i suoi giocatori? Tutti i dati associati andranno persi per sempre."
            : "Sei sicuro di voler eliminare questo giocatore? I suoi dati e statistiche verranno rimossi per sempre."
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setIdToDelete(null);
          setDeleteType(null);
        }}
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        type="danger"
      />
    </div>
  );
}
