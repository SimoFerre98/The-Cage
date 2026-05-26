import React from 'react';

const EVENTS = [
  { minute: 5, type: 'Carta Attivata', player: 'Amatori Calcio Genova', team: 'home', detail: 'starplayer' },
  { minute: 12, type: 'Goal (Stella)', player: 'Rossi L.', team: 'home' },
  { minute: 18, type: 'Yellow Card', player: 'Bruno T.', team: 'away' },
  { minute: 26, type: 'Carta Attivata', player: 'Montarsolo', team: 'away', detail: 'goalx2' },
  { minute: 28, type: 'Goal (Raddoppiato)', player: 'Amato C.', team: 'away' },
  { minute: 34, type: 'Carta Attivata', player: 'Amatori Calcio Genova', team: 'home', detail: 'penalty' },
  { minute: 35, type: 'Goal (Penalty)', player: 'Rossi L.', team: 'home' },
  { minute: 42, type: 'Red Card', player: 'Ferrari M.', team: 'home' },
  { minute: 45, type: 'Carta Attivata', player: 'Montarsolo', team: 'away', detail: 'joker' },
];

export default function LiveMatchIsland() {
  return (
    <div className="flex flex-col w-full text-white min-h-screen">
      {/* Header 3D */}
      <div 
        className="relative w-full bg-cover bg-bottom bg-no-repeat overflow-hidden border-b-[3px] border-[#382613]"
        style={{ height: '320px', backgroundImage: `url('/3d-field.png')`, boxShadow: '0 20px 50px rgba(0,0,0,0.9)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,0,0,0.8)] via-[rgba(0,0,0,0.2)] to-transparent"></div>
        
        {/* Top Navbar */}
        <div className="absolute top-0 left-0 w-full flex items-center justify-between p-6 z-20">
           <a href="/calendario" className="text-white text-3xl drop-shadow-md leading-none transition-transform active:scale-95 text-decoration-none">‹</a>
           <span className="font-bold tracking-widest text-lg text-white drop-shadow-md uppercase">Live</span>
           <div className="w-6"></div> {/* Spacer for centering */}
        </div>

        {/* Score */}
        <div className="absolute top-16 left-0 w-full flex justify-center z-20">
           <div className="flex items-center gap-6 text-6xl font-light drop-shadow-lg tracking-widest tabular-nums">
             <span>3</span>
             <span className="text-white/60 text-4xl -translate-y-1">:</span>
             <span>2</span>
           </div>
        </div>

        {/* Logos on the field */}
        <div className="absolute bottom-12 left-0 w-full flex items-end justify-center z-20">
           <div className="relative flex items-center justify-between w-full max-w-[360px] px-10">
              
              {/* Home Team */}
              <div className="relative flex flex-col items-center">
                 {/* Shadow on the grass */}
                 <div className="absolute -bottom-3 w-16 h-3 bg-black/60 blur-[4px] rounded-[100%]"></div>
                 {/* Logo */}
                 <div className="relative w-[4.5rem] h-[5.5rem] rounded-b-full bg-gradient-to-b from-red-600 to-red-800 border-[2px] border-yellow-400/80 shadow-2xl flex flex-col items-center justify-center font-black text-2xl text-white">
                   <span className="text-xs uppercase tracking-widest text-yellow-300 mt-2">ACG</span>
                 </div>
              </div>
              
              {/* Away Team */}
              <div className="relative flex flex-col items-center">
                 {/* Shadow on the grass */}
                 <div className="absolute -bottom-3 w-16 h-3 bg-black/60 blur-[4px] rounded-[100%]"></div>
                 {/* Logo */}
                 <div className="relative w-[4.5rem] h-[5.5rem] rounded-b-full bg-gradient-to-b from-blue-600 to-blue-900 border-[2px] border-yellow-400/80 shadow-2xl flex flex-col items-center justify-center font-black text-2xl text-white">
                   <span className="text-[0.6rem] uppercase tracking-widest text-yellow-300 mt-2 text-center leading-tight">FC<br/>MON</span>
                 </div>
              </div>

           </div>
        </div>
      </div>

      {/* Timeline background gradient */}
      <div className="relative flex-1 px-4 max-w-[500px] mx-auto w-full pt-12 pb-24">
         <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-20 pointer-events-none"></div>
                  <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/20 -translate-x-1/2"></div>
          
          <div className="flex flex-col gap-8 relative z-10">
            {EVENTS.map((ev, i) => {
              const isCard = ev.type === 'Carta Attivata';
              const isHome = ev.team === 'home';
              return (
                <div key={i} className="flex items-center w-full min-w-0">
                  {/* Left Side (Home) */}
                  <div className="flex-1 flex justify-end pr-3.5 min-w-0">
                    {isHome && (
                      isCard ? (
                        <div className="flex flex-col items-end gap-1 max-w-full">
                          <span className="text-[0.6rem] font-black tracking-widest text-white/40 uppercase truncate w-full text-right">
                            {ev.player}
                          </span>
                          {renderEventMedia(ev)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 text-right flex-row-reverse min-w-0">
                           <div className="flex-shrink-0">
                             {renderEventMedia(ev)}
                           </div>
                           <div className="flex flex-col min-w-0">
                             <span className="font-extrabold text-[0.8rem] md:text-[0.9rem] tracking-wide text-white drop-shadow-md uppercase leading-tight truncate">{ev.player}</span>
                             <span className="text-[0.65rem] text-white/60 font-semibold mt-0.5 truncate">{ev.type}</span>
                           </div>
                        </div>
                      )
                    )}
                  </div>
                  
                  {/* Center Dot (Minute) */}
                  <div className="flex-shrink-0 z-10 px-1">
                     <div className="w-8 h-8 rounded-full flex items-center justify-center text-[0.75rem] font-bold text-white/95 border border-[var(--glass-border)] bg-[#0d111d]/90 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                       {ev.minute}'
                     </div>
                  </div>

                  {/* Right Side (Away) */}
                  <div className="flex-1 flex justify-start pl-3.5 min-w-0">
                    {!isHome && (
                      isCard ? (
                        <div className="flex flex-col items-start gap-1 max-w-full">
                          <span className="text-[0.6rem] font-black tracking-widest text-white/40 uppercase truncate w-full text-left">
                            {ev.player}
                          </span>
                          {renderEventMedia(ev)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 text-left min-w-0">
                           <div className="flex-shrink-0">
                             {renderEventMedia(ev)}
                           </div>
                           <div className="flex flex-col min-w-0">
                             <span className="font-extrabold text-[0.8rem] md:text-[0.9rem] tracking-wide text-white drop-shadow-md uppercase leading-tight truncate">{ev.player}</span>
                             <span className="text-[0.65rem] text-white/60 font-semibold mt-0.5 truncate">{ev.type}</span>
                           </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
       </div>
    </div>
  );
}

function renderEventMedia(ev: any) {
  switch (ev.type) {
    case 'Goal':
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-[var(--glass-border)] shadow-[0_0_8px_rgba(255,255,255,0.05)]">
          <span className="text-sm">⚽</span>
        </div>
      );
    case 'Goal (Penalty)':
    case 'Goal (Stella)':
    case 'Goal (Raddoppiato)':
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
          <span className="text-sm">⚽</span>
        </div>
      );
    case 'Yellow Card':
      return (
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="w-3.5 h-5 rounded-[2px] bg-yellow-400 border border-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.5)] rotate-12 transform-gpu" />
        </div>
      );
    case 'Red Card':
      return (
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="w-3.5 h-5 rounded-[2px] bg-red-600 border border-red-500 shadow-[0_0_8px_rgba(220,38,38,0.5)] rotate-12 transform-gpu" />
        </div>
      );
    case 'Injured':
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20">
          <span className="text-xs">🚑</span>
        </div>
      );
    case 'Carta Attivata':
      const cardGlows: Record<string, string> = {
        penalty: 'shadow-[0_0_12px_rgba(239,68,68,0.35)] border-red-500/30',
        shootout: 'shadow-[0_0_12px_rgba(245,158,11,0.35)] border-amber-500/30',
        suspension: 'shadow-[0_0_12px_rgba(107,114,128,0.3)] border-gray-400/30',
        goalx2: 'shadow-[0_0_12px_rgba(236,72,153,0.35)] border-pink-500/30',
        starplayer: 'shadow-[0_0_12px_rgba(168,85,247,0.35)] border-purple-500/30',
        joker: 'shadow-[0_0_12px_rgba(59,130,246,0.35)] border-blue-500/30',
      };
      
      const cardNames: Record<string, string> = {
        penalty: 'Penalty 🎯',
        shootout: 'Shootout ⚡',
        suspension: 'Suspension ⛔',
        goalx2: 'Goal X2 🔥',
        starplayer: 'Star Player 🌟',
        joker: 'Joker 🃏',
      };

      const glowClass = cardGlows[ev.detail] || 'shadow-[0_0_8px_rgba(255,255,255,0.15)] border-[rgba(255,255,255,0.06)]';
      const cardName = cardNames[ev.detail] || 'Carta Speciale';
      
      return (
        <div className="relative group">
          <div className="absolute -inset-0.5 rounded-[6px] bg-gradient-to-r from-blue-500 to-purple-500 opacity-15 blur-sm group-hover:opacity-30 transition duration-500 pointer-events-none" />
          
          <div className={`relative flex items-center gap-2 bg-[rgba(10,15,30,0.35)] border border-[rgba(255,255,255,0.06)] rounded-[8px] p-1 pr-2.5 ${glowClass}`}>
            <img 
              src={`/cards/${ev.detail}.webp`} 
              alt={cardName} 
              className="w-7 h-10 rounded-[3px] object-cover shadow-[0_2px_6px_rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.06)]"
            />
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[0.55rem] font-bold text-white/40 uppercase tracking-widest leading-none">Carta Giocata</span>
              <span className="text-[0.65rem] font-black text-white mt-1 uppercase tracking-wide truncate">{cardName}</span>
            </div>
          </div>
        </div>
      );
    default:
      return <span className="text-white">•</span>;
  }
}
