import React from 'react';

const EVENTS = [
  { minute: 28, type: 'Yellow Card', player: 'Rossi L.', team: 'home' },
  { minute: 32, type: 'Goal', player: 'Amato C.', team: 'away' },
  { minute: 48, type: 'Injured', player: 'Bianchi A.', team: 'home' },
  { minute: 62, type: 'Goal', player: 'Sanna M.', team: 'away' },
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
             <span>2</span>
             <span className="text-white/60 text-4xl -translate-y-1">:</span>
             <span>1</span>
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
           {EVENTS.map((ev, i) => (
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
                   <div className={`flex items-center gap-3 ${ev.team === 'home' ? 'flex-row-reverse text-right' : 'text-left'}`}>
                      {/* Icon */}
                      <span className="text-xl drop-shadow-md opacity-90">{getEventIcon(ev.type)}</span>
                      {/* Text */}
                      <div className="flex flex-col">
                        <span className="font-bold text-[1.05rem] tracking-wide text-white drop-shadow-md uppercase leading-tight">{ev.player}</span>
                        <span className="text-[0.8rem] text-white/70 font-medium">{ev.type}</span>
                      </div>
                   </div>
                </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}

function getEventIcon(type: string) {
  if (type === 'Goal') return '⚽';
  if (type === 'Yellow Card') return '🟨';
  if (type === 'Red Card') return '🟥';
  if (type === 'Injured') return '🚑';
  return '•';
}
