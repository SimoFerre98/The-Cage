import { useState } from 'react';
import GlassEffect from './GlassEffect';

const STANDINGS = [
  { team: 'Montarsolo',             g: 3, v: 3, n: 0, p: 0, gf: 10, gs: 3, pt: 9 },
  { team: 'Amatori Calcio Genova',  g: 3, v: 2, n: 0, p: 1, gf: 7,  gs: 4, pt: 6 },
  { team: 'Samu Betti',             g: 2, v: 2, n: 0, p: 0, gf: 9,  gs: 4, pt: 6 },
  { team: 'Mario',                  g: 2, v: 2, n: 0, p: 0, gf: 6,  gs: 2, pt: 6 },
  { team: 'Tama',                   g: 2, v: 1, n: 0, p: 1, gf: 4,  gs: 5, pt: 3 },
  { team: 'UCG (Bairon)',           g: 2, v: 0, n: 2, p: 0, gf: 3,  gs: 3, pt: 2 },
  { team: 'Dario',                  g: 2, v: 0, n: 2, p: 0, gf: 3,  gs: 3, pt: 2 },
  { team: 'Corsi',                  g: 2, v: 0, n: 0, p: 2, gf: 2,  gs: 6, pt: 0 },
  { team: 'Taverna',                g: 1, v: 0, n: 0, p: 1, gf: 1,  gs: 3, pt: 0 },
  { team: 'Martino Gonzalez',       g: 1, v: 0, n: 0, p: 1, gf: 0,  gs: 2, pt: 0 },
  { team: 'chainz Andrea Robbiano', g: 1, v: 0, n: 0, p: 1, gf: 2,  gs: 5, pt: 0 },
];

const SCORERS = [
  { name: 'De Luca E.',   team: 'Tama',                   goals: 7 },
  { name: 'Amato C.',     team: 'Montarsolo',              goals: 6 },
  { name: 'Betti S.',     team: 'Samu Betti',              goals: 5 },
  { name: 'Rossi L.',     team: 'Amatori Calcio Genova',   goals: 4 },
  { name: 'Fontana C.',   team: 'Mario',                   goals: 3 },
  { name: 'Robbiano A.',  team: 'chainz Andrea Robbiano',  goals: 3 },
  { name: 'Vitale P.',    team: 'Corsi',                   goals: 2 },
  { name: 'Greco N.',     team: 'Tama',                    goals: 2 },
  { name: 'Ferrari M.',   team: 'Amatori Calcio Genova',   goals: 2 },
  { name: 'Ruggiero M.',  team: 'UCG (Bairon)',            goals: 1 },
];

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

  return (
    <div>
      {/* Controls Container */}
      <div className="flex items-center justify-center gap-4 w-full mb-6 px-4 max-w-[420px] mx-auto relative z-10">
        
        {/* Pill Toggle */}
        <div className="flex-1 w-full max-w-[320px]">
          <GlassEffect className="w-full rounded-[50px] p-1.5 cursor-pointer">
            <div className="relative flex w-full">
              <div 
                className="absolute top-0 bottom-0 w-1/2 bg-[rgba(59,130,246,0.3)] shadow-[inset_0_1px_4px_rgba(255,255,255,0.4)] rounded-[50px]" 
                style={{ 
                  transform: tab === 'squadre' ? 'translateX(0)' : 'translateX(100%)',
                  transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              ></div>
              <button
                className={`flex-1 relative z-10 py-4 text-[0.95rem] font-bold transition-all duration-300 tracking-wide outline-none ${tab === 'squadre' ? 'text-white drop-shadow-md' : 'text-white/50 hover:text-white/80'}`}
                onClick={() => setTab('squadre')}
              >
                Squadre
              </button>
              <button
                className={`flex-1 relative z-10 py-4 text-[0.95rem] font-bold transition-all duration-300 tracking-wide outline-none ${tab === 'marcatori' ? 'text-white drop-shadow-md' : 'text-white/50 hover:text-white/80'}`}
                onClick={() => setTab('marcatori')}
              >
                Marcatori
              </button>
            </div>
          </GlassEffect>
        </div>

        {/* Legend Button */}
        <GlassEffect className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0">
          <button
            onClick={() => setShowLegend(true)}
            className="w-full h-full flex items-center justify-center text-xl opacity-80 hover:opacity-100 transition-opacity outline-none"
          >
            ℹ️
          </button>
        </GlassEffect>
      </div>

      {/* Classifica Squadre */}
      {tab === 'squadre' && (
        <div className="glass-card animate-stagger" style={{ padding: '0.5rem 0', overflowX: 'auto' }}>
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
            <tbody>
              {STANDINGS.map((row, i) => (
                <tr key={i} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-300">
                  <td className="px-2 py-3 text-center">
                    <span className={`text-[0.8rem] font-bold ${i < 3 ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div className={`team-avatar avatar-${AVATAR_IDX[row.team] ?? 0}`} style={{ width: 26, height: 26, borderRadius: 7, fontSize: '0.55rem', flexShrink: 0 }}>
                        {AVATAR_INITIALS(row.team)}
                      </div>
                      <span className="text-[0.85rem] font-bold text-[var(--text-primary)]">{row.team}</span>
                    </div>
                  </td>
                  <td className="px-1 py-3 text-center text-sm text-[var(--text-secondary)]">{row.g}</td>
                  <td className="px-1 py-3 text-center text-sm text-[var(--text-secondary)]">{row.v}</td>
                  <td className="px-1 py-3 text-center text-sm text-[var(--text-secondary)]">{row.n}</td>
                  <td className="px-1 py-3 text-center text-sm text-[var(--text-secondary)]">{row.p}</td>
                  <td className="px-1 py-3 text-center text-sm text-[var(--text-secondary)]">{row.gf}</td>
                  <td className="px-1 py-3 text-center text-sm text-[var(--text-secondary)]">{row.gs}</td>
                  <td className="px-2 py-3 text-center"><span className="font-black text-white text-[0.95rem]">{row.pt}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Marcatori */}
      {tab === 'marcatori' && (
        <div className="glass-card animate-stagger">
          {SCORERS.map((s, i) => (
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
                <div className="text-[0.9rem] font-bold text-[var(--text-primary)]">{s.name}</div>
                <div className="text-[0.75rem] text-[var(--text-muted)]">{s.team}</div>
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
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="text-lg font-bold text-white mb-5 flex justify-between items-center">
              Legenda
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                onClick={() => setShowLegend(false)}
              >
                ✕
              </button>
            </div>
            {LEGEND.map((l, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-[rgba(255,255,255,0.05)] last:border-0 text-sm">
                <span className="w-8 text-center font-black text-[var(--accent-primary)]">{l.label}</span>
                <span className="text-[var(--text-secondary)]">{l.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
