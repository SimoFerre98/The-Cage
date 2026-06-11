import React from "react";

import GlassEffect from './GlassEffect';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: '🏠', id: 'home' },
  { href: '/calendario', label: 'Calendario', icon: '📅', id: 'calendario' },
  { href: '/classifica', label: 'Classifica', icon: '🏆', id: 'classifica' },
  { href: '/carte', label: 'Carte', icon: '🃏', id: 'carte' },
];

export default function LiquidNav({ activePage }: { activePage: string }) {
  return (
    <div
      className="pointer-events-auto relative rounded-[2.6rem] menu-glow-pulse group transition-all duration-700"
    >
      {/*
        Gradient border layer: positioned absolute, fills the full capsule,
        then masked so only the 2px outer ring is visible.
        The glass content below is completely unaffected.
      */}
      <div
        className="border-glow-flow"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '2.6rem',
          padding: '2px',
          /* mask trick: show only the padding ring, hide the content area */
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          mask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* Inner Glass Pill — GlassEffect handles blur/tint on its own */}
      <GlassEffect className="rounded-[2.5rem] p-2.5 group-hover:p-3 transition-all duration-700 relative">
        <div className="relative flex items-center justify-center gap-2 rounded-[2.5rem] px-1">
          {NAV_ITEMS.map((item, index) => {
            const isActive = activePage === item.id;
            return (
              <a
                key={index}
                href={item.href}
                className={`relative flex flex-col items-center justify-center w-[4.5rem] h-[4.5rem] rounded-[1.8rem] transition-all duration-700 cursor-pointer ${
                  !isActive ? 'hover:bg-[var(--glass-hover)] hover:scale-110' : ''
                }`}
                style={{
                  transformOrigin: 'center center',
                  transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 2.2)',
                  textDecoration: 'none',
                }}
              >
                {isActive && (
                  <div
                    className="absolute inset-0 bg-[var(--accent-glow)] border border-[var(--glass-border-light)] shadow-[var(--inner-glow-strong)] rounded-[1.8rem] pointer-events-none"
                    style={{ viewTransitionName: 'nav-active-bubble' } as React.CSSProperties}
                  />
                )}
                <span
                  className="relative z-10 text-[1.8rem] drop-shadow-md"
                  style={{ filter: isActive ? 'drop-shadow(0 0 8px var(--accent-primary))' : 'none' }}
                >
                  {item.icon}
                </span>
                <span className={`relative z-10 text-[0.65rem] mt-1 font-bold tracking-wide ${isActive ? 'text-[var(--text-primary)] font-extrabold' : 'text-[var(--text-secondary)]'}`}>
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
