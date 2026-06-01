import { useState, useEffect } from 'react';
import GlassEffect from './GlassEffect';
import { supabase } from '../lib/supabase';

const LEGEND = [
  { label: 'PT', desc: 'Punti totali' },
  { label: 'G',  desc: 'Partite giocate' },
  { label: 'V',  desc: 'Vittorie' },
  { label: 'N',  desc: 'Pareggi' },
  { label: 'P',  desc: 'Sconfitte' },
  { label: 'GF', desc: 'Gol fatti' },
  { label: 'GS', desc: 'Gol subiti' },
];

const AVATAR_INITIALS = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const AVATAR_IDX: Record<string, number> = {
  'Amatori Calcio Genova': 0,
  'Tama': 1,
  'Mario': 2,
  'Corsi': 3,
  'Montarsolo': 4,
  'Dario': 5,
  'Taverna': 6,
  'UCG (Bairon)': 7,
  'Samu Betti': 8,
  'chainz Andrea Robbiano': 9,
  'Martino Gonzalez': 10,
};

export default function ClassificaIsland() {
  const [tab, setTab] = useState<'squadre' | 'marcatori'>('squadre');
  const [showLegend, setShowLegend] = useState(false);
  const [standings, setStandings] = useState<any[]>([]);
  const [scorers, setScorers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [standingsRes, scorersRes] = await Promise.all([
        supabase.from('standings').select('*'),
        supabase.from('top_scorers').select('*')
      ]);

      if (standingsRes.data) {
        setStandings(standingsRes.data);
      }
      if (scorersRes.data) {
        setScorers(scorersRes.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div>
      {/* Controls Container */}
      <div className="flex items-center justify-center gap-4 w-full mb-14 px-4 max-w-[460px] mx-auto sticky top-[85px] md:top-8 z-[120] transition-all duration-300">
        
        {/* Pill Toggle */}
        <div className="flex-1 w-full max-w-[360px]">
          <GlassEffect className="w-full rounded-[50px] p-2 cursor-pointer">
            <div className="relative flex w-full">
              <div 
                className="absolute top-0 bottom-0 w-1/2 bg-[rgba(59,130,246,0.3)] shadow-[inset_0_1px_4px_rgba(255,255,255,0.4)] rounded-[50px]" 
                style={{ 
                  transform: tab === 'squadre' ? 'translateX(0)' : 'translateX(100%)',
                  transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              ></div>
              <button
                className={`flex-1 relative z-10 py-5 text-[1rem] font-bold transition-all duration-300 tracking-wide outline-none ${tab === 'squadre' ? 'text-white drop-shadow-md' : 'text-white/50 hover:text-white/80'}`}
                onClick={() => setTab('squadre')}
              >
                Squadre
              </button>
              <button
                className={`flex-1 relative z-10 py-5 text-[1rem] font-bold transition-all duration-300 tracking-wide outline-none ${tab === 'marcatori' ? 'text-white drop-shadow-md' : 'text-white/50 hover:text-white/80'}`}
                onClick={() => setTab('marcatori')}
              >
                Marcatori
              </button>
            </div>
          </GlassEffect>
        </div>

        {/* Legend Button */}
        <GlassEffect className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 hover:scale-105 active:scale-95 transition-all duration-300">
          <button
            onClick={() => setShowLegend(true)}
            className="w-full h-full flex items-center justify-center text-white outline-none cursor-pointer"
            aria-label="Info legenda"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 opacity-70 hover:opacity-100 transition-opacity">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        </GlassEffect>
      </div>

      {/* Classifica Squadre */}
      {tab === 'squadre' && (
        <div className="glass-card animate-stagger" style={{ padding: '0.5rem 0', overflowX: 'auto', marginTop: '2.5rem' }}>
          <table className="w-full border-collapse" style={{ borderSpacing: '0 4px' }}>
            <thead>
              <tr>
                <th className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 py-3 text-center">#</th>
                <th className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 py-3 text-left">Squadra</th>
                <th className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1 py-3 text-center">G</th>
                <th className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1 py-3 text-center">V</th>
                <th className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1 py-3 text-center">N</th>
                <th className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1 py-3 text-center">P</th>
                <th className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1 py-3 text-center">GF</th>
                <th className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1 py-3 text-center">GS</th>
                <th className="text-[0.65rem] font-semibold text-[var(--accent-primary)] uppercase tracking-wider px-2 py-3 text-center">PT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.07)]">
              {standings.map((row, i) => (
                <tr key={i} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-300">
                  <td className="px-2 py-3.5 text-center">
                    <span className={`text-[0.8rem] font-bold ${i < 3 ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </span>
                  </td>
                  <td className="px-2 py-3.5">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div className={`team-avatar avatar-${AVATAR_IDX[row.team_name] ?? 0}`} style={{ width: 26, height: 26, borderRadius: 7, fontSize: '0.55rem', flexShrink: 0 }}>
                        {AVATAR_INITIALS(row.team_name)}
                      </div>
                      <span className="text-[0.85rem] font-bold text-[var(--text-primary)]">{row.team_name}</span>
                    </div>
                  </td>
                  <td className="px-1 py-3.5 text-center text-sm text-[var(--text-secondary)]">{row.g}</td>
                  <td className="px-1 py-3.5 text-center text-sm text-[var(--text-secondary)]">{row.v}</td>
                  <td className="px-1 py-3.5 text-center text-sm text-[var(--text-secondary)]">{row.n}</td>
                  <td className="px-1 py-3.5 text-center text-sm text-[var(--text-secondary)]">{row.p}</td>
                  <td className="px-1 py-3.5 text-center text-sm text-[var(--text-secondary)]">{row.gf}</td>
                  <td className="px-1 py-3.5 text-center text-sm text-[var(--text-secondary)]">{row.gs}</td>
                  <td className="px-2 py-3.5 text-center"><span className="font-black text-white text-[0.95rem]">{row.pt}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Marcatori */}
      {tab === 'marcatori' && (
        <div className="glass-card animate-stagger" style={{ marginTop: '2.5rem' }}>
          {scorers.map((s, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--glass-border)] hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-300">
              <div 
                className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shrink-0 border"
                style={{
                  background: i === 0 ? 'rgba(245, 158, 11, 0.15)' : i === 1 ? 'rgba(148, 163, 184, 0.15)' : i === 2 ? 'rgba(180, 83, 9, 0.15)' : 'var(--glass-bg)',
                  borderColor: i === 0 ? 'rgba(245, 158, 11, 0.3)' : i === 1 ? 'rgba(148, 163, 184, 0.3)' : i === 2 ? 'rgba(180, 83, 9, 0.3)' : 'var(--glass-border)',
                  color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#fb923c' : 'var(--text-muted)'
                }}
              >
                {i < 3 ? (i === 0 ? '🏅' : i === 1 ? '2' : '3') : i + 1}
              </div>
              <div className="flex-1">
                <div className="text-[0.9rem] font-bold text-[var(--text-primary)]">{s.player_name}</div>
                <div className="text-[0.75rem] text-[var(--text-muted)]">{s.team_name}</div>
              </div>
              <div className="flex items-center gap-1.5 font-black text-lg text-[var(--accent-primary)]">
                <span className="text-sm">⚽</span>
                <span>{s.goals}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend Modal */}
      {showLegend && (
        <div className="modal-overlay" onClick={() => setShowLegend(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-[400px] animate-[modalSlideUp_0.4s_var(--ease-spring)] px-4">
            <GlassEffect className="w-full rounded-[24px] p-6 md:p-8 relative overflow-hidden" style={{ display: 'block' }}>
              {/* Ambient background glows */}
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[rgba(59,130,246,0.35)] blur-[40px] pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[rgba(139,92,246,0.3)] blur-[40px] pointer-events-none" />

              <div className="relative">
                <div className="grid grid-cols-[32px_1fr_32px] gap-3 items-start mb-6 pt-1 px-1 md:px-3">
                  {/* Spacer to perfectly center the title */}
                  <div className="w-8 h-8 pointer-events-none"></div>

                  <div className="flex flex-col items-center justify-center">
                    <h3 className="text-xl font-extrabold tracking-tight text-white drop-shadow text-center">
                      Legenda Classifica
                    </h3>
                    <div className="h-[2px] w-12 mt-2 rounded bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] mx-auto" />
                  </div>

                  <button 
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-red-600/40 hover:from-red-500/40 hover:to-red-600/60 border border-red-500/30 text-red-100 transition-all duration-300 hover:rotate-90 active:scale-95 cursor-pointer outline-none shadow-[0_0_10px_rgba(239,68,68,0.2)] justify-self-end"
                    onClick={() => setShowLegend(false)}
                    aria-label="Chiudi"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {LEGEND.map((l, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-4 p-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.06)] transition-all duration-300"
                    >
                      <div 
                        className="w-10 h-8 flex items-center justify-center rounded-lg font-black text-xs border"
                        style={{
                          background: l.label === 'PT' 
                            ? 'rgba(59, 130, 246, 0.25)' 
                            : 'rgba(255, 255, 255, 0.08)',
                          borderColor: l.label === 'PT' 
                            ? 'rgba(59, 130, 246, 0.4)' 
                            : 'rgba(255, 255, 255, 0.15)',
                          color: '#ffffff'
                        }}
                      >
                        {l.label}
                      </div>
                      <span className="text-sm font-semibold text-white/90">
                        {l.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassEffect>
          </div>
        </div>
      )}
    </div>
  );
}
