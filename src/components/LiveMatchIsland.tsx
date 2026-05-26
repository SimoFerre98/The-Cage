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
         
         <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/30 -translate-x-1/2"></div>
         
         <div className="flex flex-col gap-12 relative z-10">
           {EVENTS.map((ev, i) => {
             const isCard = ev.type === 'Carta Attivata';
             return (
               <div key={i} className={`relative flex items-center w-full ${ev.team === 'home' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-1/2"></div>
                  
                  {/* Central Dot (Minute) */}
                  <div className="absolute left-1/2 -translate-x-1/2 z-10">
                     <div className="w-10 h-10 rounded-full flex items-center justify-center text-[0.85rem] font-medium text-white/90 border border-white/40 bg-white/10 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                       {ev.minute}'
                     </div>
                  </div>

                  {/* Event Detail */}
                  <div className={`w-1/2 flex items-center ${ev.team === 'home' ? 'justify-end pr-8' : 'pl-8'}`}>
                     {isCard ? (
                       <div className={`flex flex-col gap-1.5 ${ev.team === 'home' ? 'items-end' : 'items-start'}`}>
                         <span className="text-[0.65rem] font-black tracking-widest text-white/45 uppercase">
                           {ev.player}
                         </span>
                         {renderEventMedia(ev)}
                       </div>
                     ) : (
                       <div className={`flex items-center gap-3.5 ${ev.team === 'home' ? 'flex-row-reverse text-right' : 'text-left'}`}>
                          {/* Icon / Media */}
                          <div className="flex-shrink-0">
                            {renderEventMedia(ev)}
                          </div>
                          {/* Text */}
                          <div className="flex flex-col justify-center">
                            <span className="font-extrabold text-[0.95rem] tracking-wide text-white drop-shadow-md uppercase leading-tight">{ev.player}</span>
                            <span className="text-[0.75rem] text-white/60 font-semibold mt-0.5">{ev.type}</span>
                          </div>
                       </div>
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
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
          <span className="text-xl">⚽</span>
        </div>
      );
    case 'Goal (Penalty)':
    case 'Goal (Stella)':
    case 'Goal (Raddoppiato)':
      return (
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-500/10 border border-green-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
          <span className="text-xl">⚽</span>
        </div>
      );
    case 'Yellow Card':
      return (
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="w-4 h-6 rounded-[2px] bg-yellow-400 border border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] rotate-12 transform-gpu" />
        </div>
      );
    case 'Red Card':
      return (
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="w-4 h-6 rounded-[2px] bg-red-600 border border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.6)] rotate-12 transform-gpu" />
        </div>
      );
    case 'Injured':
      return (
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-500/10 border border-red-500/30">
          <span className="text-lg">🚑</span>
        </div>
      );
    case 'Carta Attivata':
      const cardGlows: Record<string, string> = {
        penalty: 'shadow-[0_0_15px_rgba(239,68,68,0.4)] border-red-500/40',
        shootout: 'shadow-[0_0_15px_rgba(245,158,11,0.4)] border-amber-500/40',
        suspension: 'shadow-[0_0_15px_rgba(107,114,128,0.4)] border-gray-400/40',
        goalx2: 'shadow-[0_0_15px_rgba(236,72,153,0.4)] border-pink-500/40',
        starplayer: 'shadow-[0_0_15px_rgba(168,85,247,0.4)] border-purple-500/40',
        joker: 'shadow-[0_0_15px_rgba(59,130,246,0.4)] border-blue-500/40',
      };
      
      const cardNames: Record<string, string> = {
        penalty: 'Penalty 🎯',
        shootout: 'Shootout ⚡',
        suspension: 'Suspension ⛔',
        goalx2: 'Goal X2 🔥',
        starplayer: 'Star Player 🌟',
        joker: 'Joker 🃏',
      };

      const glowClass = cardGlows[ev.detail] || 'shadow-[0_0_10px_rgba(255,255,255,0.2)] border-white/20';
      const cardName = cardNames[ev.detail] || 'Carta Speciale';
      
      return (
        <div className="relative group">
          <div className="absolute -inset-1 rounded-[6px] bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-sm group-hover:opacity-40 transition duration-500 pointer-events-none" />
          
          <div className={`relative flex items-center gap-2 bg-[rgba(20,25,40,0.4)] border rounded-[8px] p-1.5 pr-3 ${glowClass}`}>
            <img 
              src={`/cards/${ev.detail}.webp`} 
              alt={cardName} 
              className="w-8 h-12 rounded-[4px] object-cover shadow-[0_2px_8px_rgba(0,0,0,0.5)] border border-white/10"
            />
            <div className="flex flex-col text-left">
              <span className="text-[0.65rem] font-bold text-white/50 uppercase tracking-widest leading-none">Carta Giocata</span>
              <span className="text-xs font-black text-white mt-1 uppercase tracking-wide">{cardName}</span>
            </div>
          </div>
        </div>
      );
    default:
      return <span className="text-white">•</span>;
  }
}
