import React from "react";

import GlassEffect from './GlassEffect';

const NAV_ITEMS = [
  { href: '/', label: 'Hub', icon: '🏠', id: 'hub' },
  { href: '/calendario', label: 'Calendario', icon: '📅', id: 'calendario' },
  { href: '/classifica', label: 'Classifica', icon: '🏆', id: 'classifica' },
  { href: '/carte', label: 'Carte', icon: '🃏', id: 'carte' },
];

export default function LiquidNav({ activePage }: { activePage: string }) {
  return (
    <div className="pointer-events-auto relative p-[2px] rounded-[2.6rem] overflow-hidden isolate border-glow-flow menu-glow-pulse group transition-all duration-700">
      {/* Inner Pill */}
      <GlassEffect className="rounded-[2.5rem] p-2.5 group-hover:p-3 transition-all duration-700 relative z-10 bg-[rgba(10,13,24,0.5)] backdrop-blur-2xl">
        <div className="relative flex items-center justify-center gap-2 rounded-[2.5rem] px-1 overflow-hidden">
              {NAV_ITEMS.map((item, index) => {
                const isActive = activePage === item.id;
                return (
                  <a
                    key={index}
                    href={item.href}
                    className={`relative flex flex-col items-center justify-center w-[4.5rem] h-[4.5rem] rounded-[1.8rem] transition-all duration-700 cursor-pointer ${
                      !isActive ? 'hover:bg-[rgba(255,255,255,0.1)] hover:scale-110' : ''
                    }`}
                    style={{
                      transformOrigin: "center center",
                      transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
                      textDecoration: "none"
                    }}
                  >
                    {isActive && (
                      <div 
                        className="absolute inset-0 bg-[rgba(59,130,246,0.3)] shadow-[inset_0_1px_4px_rgba(255,255,255,0.4)] rounded-[1.8rem] pointer-events-none"
                        style={{ viewTransitionName: 'nav-active-bubble' } as React.CSSProperties}
                      />
                    )}
                    <span className="relative z-10 text-[1.8rem] drop-shadow-md" style={{ filter: isActive ? 'drop-shadow(0 0 8px rgba(255,255,255,0.6))' : 'none' }}>
                      {item.icon}
                    </span>
                    <span className={`relative z-10 text-[0.65rem] mt-1 font-bold tracking-wide ${isActive ? 'text-white drop-shadow-md' : 'text-white/70'}`}>
                      {item.label}
                    </span>
                  </a>
                );
              })}
            </div>
          </GlassEffect>
    </div>
  );
}
