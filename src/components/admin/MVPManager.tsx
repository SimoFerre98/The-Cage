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
      .from('mvp_votes')
      .select('player_id');

    if (tData) setTeams(tData);
    if (pData) setPlayers(pData);
    
    if (cData) {
      setCandidates(cData);
    }

    if (vData) {
      const counts: Record<string, number> = {};
      vData.forEach(v => {
        counts[v.player_id] = (counts[v.player_id] || 0) + 1;
      });
      setVotesCount(counts);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Sottoscrivi agli aggiornamenti dei voti in tempo reale
    const channel = supabase.channel('admin_mvp_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mvp_votes' }, () => {
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
    <div className="flex flex-col gap-6">
      {/* Aggiungi Candidato */}
      <GlassEffect className="p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Aggiungi Candidato MVP</h2>
        <form onSubmit={handleAddCandidate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60 font-bold uppercase">Squadra</label>
            <select 
              value={selectedTeamId} 
              onChange={e => { setSelectedTeamId(e.target.value); setSelectedPlayerId(''); }}
              className="bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-lg p-2.5 text-white outline-none"
              required
            >
              <option value="">-- Seleziona Squadra --</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60 font-bold uppercase">Giocatore</label>
            <select 
              value={selectedPlayerId} 
              onChange={e => setSelectedPlayerId(e.target.value)}
              className="bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-lg p-2.5 text-white outline-none"
              disabled={!selectedTeamId}
              required
            >
              <option value="">-- Seleziona Giocatore --</option>
              {filteredPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 mt-2">
            <button 
              type="submit" 
              className="install-btn w-full justify-center disabled:opacity-50"
              disabled={!selectedPlayerId || candidates.length >= 5}
            >
              Aggiungi come Candidato ({candidates.length}/5)
            </button>
          </div>
        </form>
      </GlassEffect>

      {/* Candidati Attuali */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-white">Candidati Correnti e Voti</h2>
          <button 
            onClick={handleResetVotes}
            className="px-4 py-2 bg-red-600/20 text-red-200 border border-red-500/30 rounded-lg hover:bg-red-600/40 transition-colors text-xs font-bold"
          >
            Reset Totale Voti
          </button>
        </div>

        {candidates.length === 0 ? (
          <GlassEffect className="p-8 text-center rounded-xl text-white/60">
            Nessun candidato MVP impostato per questo turno. Aggiungine uno sopra.
          </GlassEffect>
        ) : (
          <div className="flex flex-col gap-3">
            {candidates.map(c => {
              const count = votesCount[c.player_id] || 0;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <GlassEffect key={c.id} className="p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-lg truncate">
                      {c.player?.name}
                    </div>
                    <div className="text-sm text-white/60 truncate">
                      {c.player?.team?.name}
                    </div>
                    
                    {/* Barra progresso voti */}
                    <div className="w-full bg-white/10 rounded-full h-2 mt-3 overflow-hidden">
                      <div 
                        className="bg-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-black text-white">{count}</div>
                      <div className="text-xs text-white/50 font-bold uppercase">{pct}%</div>
                    </div>
                    <button
                      onClick={() => handleRemoveCandidate(c.id)}
                      className="w-10 h-10 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-lg text-red-200 flex items-center justify-center transition-colors"
                      title="Rimuovi candidato"
                    >
                      🗑️
                    </button>
                  </div>
                </GlassEffect>
              );
            })}

            <div className="text-right text-xs text-white/40 font-bold pr-2">
              Voti totali espressi: {totalVotes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
