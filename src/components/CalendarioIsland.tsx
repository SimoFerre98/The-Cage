const MATCHES = [
  // Girone A - Terminati
  { date: 'lun 19 mag, 21:00', round: 'Girone A', status: 'TERMINATA', home: 'Montarsolo', away: 'Tama', score: '4 - 2' },
  { date: 'lun 19 mag, 21:30', round: 'Girone A', status: 'TERMINATA', home: 'Amatori Calcio Genova', away: 'Corsi', score: '3 - 1' },
  { date: 'mer 21 mag, 21:00', round: 'Girone A', status: 'TERMINATA', home: 'Dario', away: 'UCG (Bairon)', score: '2 - 2' },
  { date: 'mer 21 mag, 21:30', round: 'Girone A', status: 'TERMINATA', home: 'Taverna', away: 'Mario', score: '1 - 3' },
  // Girone B - Terminati
  { date: 'gio 22 mag, 21:00', round: 'Girone B', status: 'TERMINATA', home: 'Samu Betti', away: 'chainz Andrea Robbiano', score: '5 - 2' },
  { date: 'gio 22 mag, 21:30', round: 'Girone B', status: 'TERMINATA', home: 'Martino Gonzalez', away: 'Montarsolo', score: '0 - 2' },
  // Prossime
  { date: 'lun 26 mag, 21:00', round: 'Girone A', status: 'PROSSIMA', home: 'Tama', away: 'Corsi', score: null },
  { date: 'lun 26 mag, 21:30', round: 'Girone A', status: 'PROSSIMA', home: 'Montarsolo', away: 'Amatori Calcio Genova', score: null },
  { date: 'mer 28 mag, 21:00', round: 'Girone B', status: 'PROSSIMA', home: 'UCG (Bairon)', away: 'Samu Betti', score: null },
  { date: 'mer 28 mag, 21:30', round: 'Girone B', status: 'PROSSIMA', home: 'chainz Andrea Robbiano', away: 'Mario', score: null },
  { date: 'ven 30 mag, 21:00', round: 'Semifinale', status: 'PROSSIMA', home: '1° Girone A', away: '2° Girone B', score: null },
  { date: 'ven 30 mag, 21:30', round: 'Finale', status: 'PROSSIMA', home: 'TBD', away: 'TBD', score: null },
];

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
  return (
    <div className="animate-stagger">
      {MATCHES.map((m, i) => (
        <div key={i} className="glass-card" style={{ marginBottom: '1rem', padding: '1.2rem 1.25rem' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-[var(--text-muted)]">📅 {m.date}</span>
            <div className="flex gap-1.5 items-center">
              <span className="badge badge-round">{m.round}</span>
              <span className={`badge ${m.status === 'TERMINATA' ? 'badge-done' : 'badge-next'}`}>
                {m.status === 'TERMINATA' ? '✓' : '⚡'} {m.status}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            {/* Home */}
            <div className="flex items-center gap-2 flex-1 justify-end flex-row-reverse text-right">
              <div className={`team-avatar avatar-${TEAM_IDX[m.home] ?? 0}`} style={{ width: 34, height: 34, borderRadius: 10 }}>
                {AVATAR_INITIALS(m.home)}
              </div>
              <span className="text-[0.875rem] font-bold text-[var(--text-primary)] leading-tight">{m.home}</span>
            </div>

            {/* Score / VS */}
            {m.score ? (
              <div className="bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] rounded-[12px] py-1.5 px-3.5 text-lg font-black text-white tracking-widest min-w-[76px] text-center shadow-[var(--inner-glow)]">
                {m.score}
              </div>
            ) : (
              <div className="bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] rounded-[12px] py-1.5 px-4 text-sm font-bold text-[var(--accent-primary)] tracking-widest min-w-[76px] text-center shadow-[var(--inner-glow)]">
                VS
              </div>
            )}

            {/* Away */}
            <div className="flex items-center gap-2 flex-1 text-left">
              <div className={`team-avatar avatar-${TEAM_IDX[m.away] ?? 1}`} style={{ width: 34, height: 34, borderRadius: 10 }}>
                {AVATAR_INITIALS(m.away)}
              </div>
              <span className="text-[0.875rem] font-bold text-[var(--text-primary)] leading-tight">{m.away}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
