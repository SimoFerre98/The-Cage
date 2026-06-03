import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import GlassEffect from '../GlassEffect';

// Lazy loading admin subcomponents to reduce initial bundle size
const TeamsPlayersManager = React.lazy(() => import('./TeamsPlayersManager'));
const MatchesManager = React.lazy(() => import('./MatchesManager'));
const LiveController = React.lazy(() => import('./LiveController'));
const MVPManager = React.lazy(() => import('./MVPManager'));

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'squadre' | 'partite' | 'live' | 'mvp'>('squadre');

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

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
      <GlassEffect className="w-full rounded-[20px] p-2">
        <div className="flex w-full overflow-x-auto gap-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('squadre')}
            className={`flex-1 min-w-[120px] py-2.5 px-2 rounded-xl font-bold transition-all text-xs md:text-sm flex items-center justify-center text-center ${activeTab === 'squadre' ? 'bg-[rgba(59,130,246,0.4)] text-white shadow-lg border border-[rgba(59,130,246,0.5)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            Squadre & Giocatori
          </button>
          <button
            onClick={() => setActiveTab('partite')}
            className={`flex-1 min-w-[120px] py-2.5 px-2 rounded-xl font-bold transition-all text-xs md:text-sm flex items-center justify-center text-center ${activeTab === 'partite' ? 'bg-[rgba(59,130,246,0.4)] text-white shadow-lg border border-[rgba(59,130,246,0.5)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            Calendario
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 min-w-[120px] py-2.5 px-2 rounded-xl font-bold transition-all text-xs md:text-sm flex items-center justify-center gap-2 text-center ${activeTab === 'live' ? 'bg-red-500/30 text-white shadow-lg border border-red-500/50' : 'text-red-400/50 hover:text-red-400 hover:bg-red-500/10 border border-transparent'}`}
          >
            <span className="relative flex h-2 w-2 flex-shrink-0">
              {activeTab === 'live' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Regia LIVE
          </button>
          <button
            onClick={() => setActiveTab('mvp')}
            className={`flex-1 min-w-[120px] py-2.5 px-2 rounded-xl font-bold transition-all text-xs md:text-sm flex items-center justify-center gap-2 text-center ${activeTab === 'mvp' ? 'bg-[rgba(139,92,246,0.4)] text-white shadow-lg border border-[rgba(139,92,246,0.5)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            Gestione MVP
          </button>
        </div>
      </GlassEffect>

      {/* Content */}
      <div className="mt-2 animate-[modalSlideUp_0.3s_ease-out]">
        <React.Suspense fallback={<div className="text-white/65 p-6 text-center">Caricamento sezione...</div>}>
          {activeTab === 'squadre' && <TeamsPlayersManager />}
          {activeTab === 'partite' && <MatchesManager />}
          {activeTab === 'live' && <LiveController />}
          {activeTab === 'mvp' && <MVPManager />}
        </React.Suspense>
      </div>
    </div>
  );
}
