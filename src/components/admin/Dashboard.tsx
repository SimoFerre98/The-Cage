import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import GlassEffect from '../GlassEffect';
import TeamsPlayersManager from './TeamsPlayersManager';
import MatchesManager from './MatchesManager';
import LiveController from './LiveController';
import type { Team, Player, Match } from './types';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'squadre' | 'partite' | 'live'>('squadre');

  // ── Stato centralizzato ────────────────────────────────────────────────────
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [deviceLastSeen, setDeviceLastSeen] = useState<string | null>(null);
  const [isDeviceOnline, setIsDeviceOnline] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // ── Fetch teams + players (join unico) ────────────────────────────────────
  const refreshTeams = useCallback(async () => {
    const { data } = await supabase
      .from('teams')
      .select('id, name, players(id, name, team_id, role)')
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

  // ── Fetch stato centralina ESP32 ──────────────────────────────────────────
  const refreshDeviceStatus = useCallback(async () => {
    const { data } = await supabase
      .from('device_status')
      .select('last_seen')
      .eq('id', 'esp32_centralina')
      .maybeSingle();
    if (data) {
      setDeviceLastSeen(data.last_seen);
    }
  }, []);

  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected'>('connecting');

  // ── Caricamento iniziale ──────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([refreshTeams(), refreshMatches(), refreshDeviceStatus()]).finally(() =>
      setInitialLoading(false)
    );
  }, [refreshTeams, refreshMatches, refreshDeviceStatus]);

  // ── Sincronizzazione Realtime Centralizzata ────────────────────────────────
  useEffect(() => {
    const channel = supabase.channel('admin_dashboard_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        refreshTeams();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        refreshTeams();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        refreshMatches();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'device_status', filter: 'id=eq.esp32_centralina' }, (payload) => {
        if (payload.new && (payload.new as any).last_seen) {
          setDeviceLastSeen((payload.new as any).last_seen);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else {
          setRealtimeStatus('connecting');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshTeams, refreshMatches, refreshDeviceStatus]);

  // ── Calcolo stato Online/Offline della centralina ────────────────────────
  useEffect(() => {
    if (!deviceLastSeen) {
      setIsDeviceOnline(false);
      return;
    }
    
    const checkOnline = () => {
      const lastSeenTime = new Date(deviceLastSeen).getTime();
      const now = new Date().getTime();
      // Mostra online se l'heartbeat è stato inviato negli ultimi 75 secondi
      setIsDeviceOnline(now - lastSeenTime < 75000);
    };

    checkOnline();
    const interval = setInterval(checkOnline, 10000);
    
    return () => clearInterval(interval);
  }, [deviceLastSeen]);

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
  const childProps = { 
    teams, 
    players, 
    matches, 
    onRefreshTeams: refreshTeams, 
    onRefreshMatches: refreshMatches,
    isDeviceOnline,
    deviceLastSeen
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mt-4">
        <div>
          <h1 className="text-3xl font-black text-white drop-shadow-md">Dashboard</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-white/60 text-sm">Gestione dati e regia</p>
            <span className="text-white/20 text-xs">•</span>
            {isDeviceOnline ? (
              <span className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/35 px-2.5 py-0.5 rounded-full text-[10px] text-green-400 font-extrabold uppercase tracking-wider animate-[pulse_2s_infinite]">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                ESP32 Online
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full text-[10px] text-white/40 font-extrabold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-white/30"></span>
                ESP32 Offline
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500/20 text-red-200 border border-red-500/30 rounded-lg hover:bg-red-500/40 transition-colors text-sm font-bold"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-3 w-full mb-8 mt-2">
        <button
          onClick={() => setActiveTab('squadre')}
          className={`px-6 py-2.5 rounded-full font-bold text-xs md:text-sm transition-all border duration-300 cursor-pointer ${
            activeTab === 'squadre'
              ? 'bg-[rgba(59,130,246,0.3)] text-white border-[rgba(59,130,246,0.5)] shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_4px_rgba(255,255,255,0.2)] scale-105'
              : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
          }`}
        >
          Squadre
        </button>
        <button
          onClick={() => setActiveTab('partite')}
          className={`px-6 py-2.5 rounded-full font-bold text-xs md:text-sm transition-all border duration-300 cursor-pointer ${
            activeTab === 'partite'
              ? 'bg-[rgba(59,130,246,0.3)] text-white border-[rgba(59,130,246,0.5)] shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_4px_rgba(255,255,255,0.2)] scale-105'
              : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
          }`}
        >
          Calendario
        </button>
        <button
          onClick={() => setActiveTab('live')}
          className={`px-6 py-2.5 rounded-full font-bold text-xs md:text-sm transition-all border duration-300 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'live'
              ? 'bg-red-500/30 text-white border-red-500/50 shadow-[0_2px_8px_rgba(239,68,68,0.3),inset_0_1px_4px_rgba(255,255,255,0.2)] scale-105'
              : 'bg-white/5 text-red-400/70 border-white/10 hover:text-red-400 hover:bg-red-500/10 hover:border-white/20'
          }`}
        >
          <span className="relative flex h-2 w-2 flex-shrink-0">
            {activeTab === 'live' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Regia LIVE
        </button>
      </div>

      {/* Content — nessun Suspense, componenti importati direttamente */}
      <div className="mt-2 animate-[modalSlideUp_0.3s_ease-out]">
        {activeTab === 'squadre' && <TeamsPlayersManager {...childProps} />}
        {activeTab === 'partite' && <MatchesManager {...childProps} />}
        {activeTab === 'live' && <LiveController {...childProps} />}
      </div>
    </div>
  );
}
