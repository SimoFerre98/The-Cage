import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import GlassEffect from '../GlassEffect';

export default function MVPManager() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [votesCount, setVotesCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    // 1. Carica le squadre e i candidati
    const { data: tData } = await supabase.from('teams').select('*').order('name');
    const { data: pData } = await supabase.from('players').select('*').order('name');
    
    // 2. Carica i candidati correnti (con i dati del giocatore e della squadra)
    const { data: cData } = await supabase
      .from('mvp_candidates')
      .select('id, player_id, player:players(name, team_id, team:teams(name))');

    // 3. Carica i voti reali per contare
    const { data: vData } = await supabase
      .from('mvp_votes_summary')
      .select('player_id, vote_count');

    if (tData) setTeams(tData);
    if (pData) setPlayers(pData);
    
    if (cData) {
      setCandidates(cData);
    }

    if (vData) {
      const counts: Record<string, number> = {};
      vData.forEach(v => {
        counts[v.player_id] = v.vote_count;
      });
      setVotesCount(counts);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Sottoscrivi agli aggiornamenti dei voti in tempo reale
    const channel = supabase.channel('admin_mvp_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mvp_votes' }, (payload) => {
        const newVote = payload.new as { player_id: string };
        if (newVote && newVote.player_id) {
          setVotesCount(prev => ({
            ...prev,
            [newVote.player_id]: (prev[newVote.player_id] || 0) + 1
          }));
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'mvp_votes' }, (payload) => {
        const oldVote = payload.old as { player_id?: string };
        if (oldVote && oldVote.player_id) {
          setVotesCount(prev => ({
            ...prev,
            [oldVote.player_id]: Math.max(0, (prev[oldVote.player_id] || 0) - 1)
          }));
        } else {
          loadData();
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mvp_votes' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mvp_candidates' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) return;

    if (candidates.length >= 5) {
      alert("Puoi impostare al massimo 5 candidati MVP contemporaneamente!");
      return;
    }

    if (candidates.some(c => c.player_id === selectedPlayerId)) {
      alert("Questo giocatore è già candidato!");
      return;
    }

    const { error } = await supabase
      .from('mvp_candidates')
      .insert([{ player_id: selectedPlayerId }]);

    if (!error) {
      setSelectedPlayerId('');
      loadData();
    } else {
      alert("Errore nell'aggiunta del candidato: " + error.message);
    }
  };

  const handleRemoveCandidate = async (candidateId: string) => {
    if (!confirm("Sei sicuro di voler rimuovere questo candidato?")) return;
    const { error } = await supabase
      .from('mvp_candidates')
      .delete()
      .eq('id', candidateId);

    if (!error) {
      loadData();
    } else {
      alert("Errore nella rimozione: " + error.message);
    }
  };

  const handleResetVotes = async () => {
    if (!confirm("ATTENZIONE: Questo eliminerà TUTTI i voti correnti e tutti i candidati per iniziare una nuova votazione. Vuoi procedere?")) return;
    
    setLoading(true);
    // Cancella tutti i voti
    const { error: errVotes } = await supabase.from('mvp_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // Cancella tutti i candidati
    const { error: errCand } = await supabase.from('mvp_candidates').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (errVotes || errCand) {
      alert("Errore nel reset: " + (errVotes?.message || errCand?.message));
    }
    loadData();
  };

  const filteredPlayers = selectedTeamId 
    ? players.filter(p => p.team_id === selectedTeamId)
    : [];

  const totalVotes = Object.values(votesCount).reduce((a, b) => a + b, 0);

  if (loading) return <div className="text-white/60">Caricamento candidati MVP...</div>;

  return (
    <div className="flex flex-col gap-8">
      {/* Aggiungi Candidato */}
      <GlassEffect className="p-8 md:p-10 rounded-[24px]">
        <h2 className="text-xl font-bold text-white mb-6 text-center uppercase tracking-wider">Aggiungi Candidato MVP</h2>
        <form onSubmit={handleAddCandidate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/60 font-bold uppercase tracking-wider ml-1 mb-1">Squadra</label>
            <select 
              value={selectedTeamId} 
              onChange={e => { setSelectedTeamId(e.target.value); setSelectedPlayerId(''); }}
              className="bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 h-[48px]"
              required
            >
              <option value="">-- Seleziona Squadra --</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/60 font-bold uppercase tracking-wider ml-1 mb-1">Giocatore</label>
            <select 
              value={selectedPlayerId} 
              onChange={e => setSelectedPlayerId(e.target.value)}
              className="bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 h-[48px]"
              disabled={!selectedTeamId}
              required
            >
              <option value="">-- Seleziona Giocatore --</option>
              {filteredPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 mt-4">
            <button 
              type="submit" 
              className="install-btn w-full justify-center disabled:opacity-50 py-4"
              disabled={!selectedPlayerId || candidates.length >= 5}
            >
              Aggiungi come Candidato ({candidates.length}/5)
            </button>
          </div>
        </form>
      </GlassEffect>

      {/* Candidati Attuali */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 mb-2 text-center">
          <div className="w-32 hidden md:block"></div> {/* spacer to center heading */}
          <h2 className="text-xl font-bold text-white flex-1 text-center uppercase tracking-wider">Candidati Correnti e Voti</h2>
          <button 
            onClick={handleResetVotes}
            className="px-4 py-2.5 bg-red-600/20 text-red-200 border border-red-500/30 rounded-xl hover:bg-red-600/40 transition-colors text-xs font-bold mx-auto md:mx-0"
          >
            Reset Totale Voti
          </button>
        </div>

        {candidates.length === 0 ? (
          <GlassEffect className="p-12 text-center rounded-[24px] text-white/60">
            Nessun candidato MVP impostato per questo turno. Aggiungine uno sopra.
          </GlassEffect>
        ) : (
          <div className="flex flex-col gap-4">
            {candidates.map(c => {
              const count = votesCount[c.player_id] || 0;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <GlassEffect key={c.id} className="p-8 rounded-[24px] flex items-center justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-lg md:text-xl truncate">
                      {c.player?.name}
                    </div>
                    <div className="text-sm text-white/60 truncate mt-1">
                      {c.player?.team?.name}
                    </div>
                    
                    {/* Barra progresso voti */}
                    <div className="w-full bg-white/10 rounded-full h-3 mt-4 overflow-hidden border border-white/5">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <div className="text-3xl font-black text-white">{count}</div>
                      <div className="text-xs text-white/50 font-bold uppercase mt-1">{pct}%</div>
                    </div>
                    <button
                      onClick={() => handleRemoveCandidate(c.id)}
                      className="w-12 h-12 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-xl text-red-200 flex items-center justify-center transition-colors"
                      title="Rimuovi candidato"
                    >
                      🗑️
                    </button>
                  </div>
                </GlassEffect>
              );
            })}

            <div className="text-right text-xs text-white/40 font-bold pr-4 mt-2">
              Voti totali espressi: {totalVotes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
