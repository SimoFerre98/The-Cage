import { useState, useEffect } from 'react';
import GlassEffect from './GlassEffect';
import { supabase } from '../lib/supabase';

const AVATAR_INITIALS = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const TEAM_IDX: Record<string, number> = {
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

export default function CalendarioIsland() {
  const [tab, setTab] = useState<'calendario' | 'tabellone'>('calendario');
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    async function loadMatches() {
      const { data } = await supabase
        .from('matches')
        .select(`
          id, match_date, round, status, home_score, away_score,
          home_team:teams!home_team_id ( name ),
          away_team:teams!away_team_id ( name )
        `)
        .order('match_date', { ascending: true });

      if (data) {
        setMatches(data);
      }
    }
    loadMatches();
  }, []);

  return (
    <div className="w-full">
      {/* Pill Toggle */}
      <div className="flex justify-center w-full mb-14 sticky top-[85px] md:top-8 z-[120] px-4 transition-all duration-300">
        <GlassEffect className="w-full max-w-[360px] rounded-[50px] p-2 cursor-pointer">
          <div className="relative flex w-full">
            <div 
              className="absolute top-0 bottom-0 w-1/2 bg-[rgba(59,130,246,0.3)] shadow-[inset_0_1px_4px_rgba(255,255,255,0.4)] rounded-[50px]" 
              style={{ 
                transform: tab === 'calendario' ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            ></div>
            <button
              className={`flex-1 relative z-10 py-5 text-[1rem] font-bold transition-all duration-300 tracking-wide outline-none ${tab === 'calendario' ? 'text-white drop-shadow-md' : 'text-white/50 hover:text-white/80'}`}
              onClick={() => setTab('calendario')}
            >
              Calendario
            </button>
            <button
              className={`flex-1 relative z-10 py-5 text-[1rem] font-bold transition-all duration-300 tracking-wide outline-none ${tab === 'tabellone' ? 'text-white drop-shadow-md' : 'text-white/50 hover:text-white/80'}`}
              onClick={() => setTab('tabellone')}
            >
              Tabellone
            </button>
          </div>
        </GlassEffect>
      </div>

      {/* Calendario Matches List */}
      {tab === 'calendario' && (
        <div className="animate-stagger">
          {matches.map((m, i) => {
            const homeName = m.home_team.name;
            const awayName = m.away_team.name;
            const scoreStr = (m.home_score !== null && m.away_score !== null && m.status !== 'PROSSIMA') ? `${m.home_score} - ${m.away_score}` : null;
            const formattedDate = new Date(m.match_date).toLocaleString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            
            const CardTag = m.status === 'LIVE' ? 'a' : 'div';
            const cardProps = m.status === 'LIVE' ? { href: '/live', style: { display: 'block', textDecoration: 'none', cursor: 'pointer', marginBottom: '1rem', padding: '1.2rem 1.25rem' } } : { style: { marginBottom: '1rem', padding: '1.2rem 1.25rem' } };

            return (
              <CardTag key={i} className={`glass-card ${m.status === 'LIVE' ? 'ring-2 ring-[rgba(239,68,68,0.5)] shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}`} {...cardProps}>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-medium ${m.status === 'LIVE' ? 'text-red-400 font-bold' : 'text-[var(--text-muted)]'}`}>
                    {m.status === 'LIVE' ? '🔴 IN DIRETTA' : `📅 ${formattedDate}`}
                  </span>
                  <div className="flex gap-1.5 items-center">
                    <span className="badge badge-round">{m.round}</span>
                    <span className={`badge ${m.status === 'TERMINATA' ? 'badge-done' : m.status === 'LIVE' ? 'badge-live' : 'badge-next'}`}>
                      {m.status === 'TERMINATA' ? '✓' : m.status === 'LIVE' ? '⚡' : '⚡'} {m.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  {/* Home */}
                  <div className="flex items-center gap-2 flex-1 justify-end flex-row-reverse text-right">
                    <div className={`team-avatar avatar-${TEAM_IDX[homeName] ?? 0}`} style={{ width: 34, height: 34, borderRadius: 10 }}>
                      {AVATAR_INITIALS(homeName)}
                    </div>
                    <span className="text-[0.875rem] font-bold text-[var(--text-primary)] leading-tight">{homeName}</span>
                  </div>

                  {/* Score / VS */}
                  {scoreStr ? (
                    <div className="bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] rounded-[12px] py-1.5 px-3.5 text-lg font-black text-white tracking-widest min-w-[76px] text-center shadow-[var(--inner-glow)]">
                      {scoreStr}
                    </div>
                  ) : (
                    <div className="bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] rounded-[12px] py-1.5 px-4 text-sm font-bold text-[var(--accent-primary)] tracking-widest min-w-[76px] text-center shadow-[var(--inner-glow)]">
                      VS
                    </div>
                  )}

                  {/* Away */}
                  <div className="flex items-center gap-2 flex-1 text-left">
                    <div className={`team-avatar avatar-${TEAM_IDX[awayName] ?? 1}`} style={{ width: 34, height: 34, borderRadius: 10 }}>
                      {AVATAR_INITIALS(awayName)}
                    </div>
                    <span className="text-[0.875rem] font-bold text-[var(--text-primary)] leading-tight">{awayName}</span>
                  </div>
                </div>
              </CardTag>
            );
          })}
        </div>
      )}

      {/* Knockout Bracket View */}
      {tab === 'tabellone' && (
        <div className="bracket-container animate-stagger" style={{ marginTop: '2rem' }}>
          {/* Top Row: Semifinale 1 and Semifinale 2 */}
          <div className="bracket-row">
            {/* Semifinale 1 Card */}
            <div className="bracket-card-wrapper">
              <div className="bracket-round-title">Semifinale 1</div>
              <div className="glass-card bracket-card">
                <div className="bracket-team">
                  <div className="team-avatar avatar-4" style={{ width: 26, height: 26, borderRadius: 6, fontSize: '0.55rem', fontWeight: 800 }}>1A</div>
                  <span className="bracket-team-name">1° Girone A</span>
                </div>
                <div className="bracket-divider" />
                <div className="bracket-team">
                  <div className="team-avatar avatar-1" style={{ width: 26, height: 26, borderRadius: 6, fontSize: '0.55rem', fontWeight: 800 }}>2B</div>
                  <span className="bracket-team-name">2° Girone B</span>
                </div>
                <div className="bracket-time">30 mag, 21:00</div>
              </div>
            </div>

            {/* Semifinale 2 Card */}
            <div className="bracket-card-wrapper">
              <div className="bracket-round-title">Semifinale 2</div>
              <div className="glass-card bracket-card">
                <div className="bracket-team">
                  <div className="team-avatar avatar-8" style={{ width: 26, height: 26, borderRadius: 6, fontSize: '0.55rem', fontWeight: 800 }}>1B</div>
                  <span className="bracket-team-name">1° Girone B</span>
                </div>
                <div className="bracket-divider" />
                <div className="bracket-team">
                  <div className="team-avatar avatar-0" style={{ width: 26, height: 26, borderRadius: 6, fontSize: '0.55rem', fontWeight: 800 }}>2A</div>
                  <span className="bracket-team-name">2° Girone A</span>
                </div>
                <div className="bracket-time">30 mag, 21:00</div>
              </div>
            </div>
          </div>

          {/* SVG Connector Lines */}
          <div className="bracket-connector-container">
            <svg className="bracket-svg" viewBox="0 0 100 50" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Left SF to Center flow */}
              <path d="M 25 0 V 25 H 50 V 50" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
              {/* Right SF to Center flow */}
              <path d="M 75 0 V 25 H 50 V 50" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
              {/* Glowing active path indicators */}
              <path d="M 25 0 V 25 H 50 V 50" stroke="url(#active-glow-left)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
              <path d="M 75 0 V 25 H 50 V 50" stroke="url(#active-glow-right)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
              
              <defs>
                <linearGradient id="active-glow-left" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="active-glow-right" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-secondary)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Bottom Row: Finale centered */}
          <div className="bracket-row-center">
            <div className="bracket-card-wrapper final-wrapper">
              <div className="bracket-round-title final-title">
                🏆 FINALE 🏆
              </div>
              <div className="glass-card bracket-card final-card-gold">
                <div className="bracket-team">
                  <div className="team-avatar avatar-9" style={{ width: 28, height: 28, borderRadius: 8, fontSize: '0.6rem', fontWeight: 800 }}>SF1</div>
                  <span className="bracket-team-name font-black">Vincitore SF1</span>
                </div>
                <div className="bracket-divider" />
                <div className="bracket-team">
                  <div className="team-avatar avatar-10" style={{ width: 28, height: 28, borderRadius: 8, fontSize: '0.6rem', fontWeight: 800 }}>SF2</div>
                  <span className="bracket-team-name font-black">Vincitore SF2</span>
                </div>
                <div className="bracket-time final-time">30 mag, 22:00</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
