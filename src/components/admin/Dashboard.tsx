import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import GlassEffect from '../GlassEffect';
import TeamsPlayersManager from './TeamsPlayersManager';
import MatchesManager from './MatchesManager';
import LiveController from './LiveController';
import MVPManager from './MVPManager';
import type { Team, Player, Match } from './types';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'squadre' | 'partite' | 'live' | 'mvp'>('squadre');

  // ── Stato centralizzato ────────────────────────────────────────────────────
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // ── Fetch teams + players (join unico) ────────────────────────────────────
  const refreshTeams = useCallback(async () => {
    const { data } = await supabase
      .from('teams')
      .select('id, name, players(id, name, team_id)')
      .order('name');
    if (data) {
      setTeams(data as Team[]);
      // Estrai lista piatta dei giocatori da usare nei componenti figli
      const flat: Player[] = data.flatMap((t: any) =>
        (t.players || []).map((p: any) => ({ ...p, team_id: t.id }))
      );
      setPlayers(flat);
    }
  }, []);

  // ── Fetch matches (con join teams) ────────────────────────────────────────
  const refreshMatches = useCallback(async () => {
    const { data } = await supabase
      .from('matches')
      .select('*, home_team:teams!home_team_id(id, name), away_team:teams!away_team_id(id, name)')
      .order('match_date', { ascending: true });
    if (data) setMatches(data as Match[]);
  }, []);

  // ── Caricamento iniziale ──────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([refreshTeams(), refreshMatches()]).finally(() =>
      setInitialLoading(false)
    );
  }, [refreshTeams, refreshMatches]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center p-20 text-white/60">
        Caricamento dashboard...
      </div>
    );
  }

  // Props condivise per tutti i componenti figli
  const childProps = { teams, players, matches, onRefreshTeams: refreshTeams, onRefreshMatches: refreshMatches };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mt-4">
        <div>
          <h1 className="text-3xl font-black text-white drop-shadow-md">Dashboard</h1>
          <p className="text-white/60 text-sm mt-1">Gestione dati e regia</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500/20 text-red-200 border border-red-500/30 rounded-lg hover:bg-red-500/40 transition-colors text-sm font-bold"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <GlassEffect className="w-full rounded-[24px] p-3 md:p-4">
        <div className="flex w-full overflow-x-auto gap-3 md:gap-4 scrollbar-hide">
          <button
            onClick={() => setActiveTab('squadre')}
            className={`flex-1 min-w-[140px] py-3.5 px-4 rounded-2xl font-bold transition-all text-xs md:text-sm flex items-center justify-center text-center ${activeTab === 'squadre' ? 'bg-[rgba(59,130,246,0.4)] text-white shadow-lg border border-[rgba(59,130,246,0.5)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            Squadre &amp; Giocatori
          </button>
          <button
            onClick={() => setActiveTab('partite')}
            className={`flex-1 min-w-[140px] py-3.5 px-4 rounded-2xl font-bold transition-all text-xs md:text-sm flex items-center justify-center text-center ${activeTab === 'partite' ? 'bg-[rgba(59,130,246,0.4)] text-white shadow-lg border border-[rgba(59,130,246,0.5)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            Calendario
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 min-w-[140px] py-3.5 px-4 rounded-2xl font-bold transition-all text-xs md:text-sm flex items-center justify-center gap-2.5 text-center ${activeTab === 'live' ? 'bg-red-500/30 text-white shadow-lg border border-red-500/50' : 'text-red-400/50 hover:text-red-400 hover:bg-red-500/10 border border-transparent'}`}
          >
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              {activeTab === 'live' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            Regia LIVE
          </button>
          <button
            onClick={() => setActiveTab('mvp')}
            className={`flex-1 min-w-[140px] py-3.5 px-4 rounded-2xl font-bold transition-all text-xs md:text-sm flex items-center justify-center gap-2.5 text-center ${activeTab === 'mvp' ? 'bg-[rgba(139,92,246,0.4)] text-white shadow-lg border border-[rgba(139,92,246,0.5)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            Gestione MVP
          </button>
        </div>
      </GlassEffect>

      {/* Content — nessun Suspense, componenti importati direttamente */}
      <div className="mt-2 animate-[modalSlideUp_0.3s_ease-out]">
        {activeTab === 'squadre' && <TeamsPlayersManager {...childProps} />}
        {activeTab === 'partite' && <MatchesManager {...childProps} />}
        {activeTab === 'live' && <LiveController {...childProps} />}
        {activeTab === 'mvp' && <MVPManager {...childProps} />}
      </div>
    </div>
  );
}
