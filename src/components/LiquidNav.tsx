import React from "react";

// Types
interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// Glass Effect Wrapper Component
const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = "",
  style = {},
}) => {
  const glassStyle = {
    boxShadow: "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  return (
    <div
      className={`relative flex font-semibold overflow-hidden text-white cursor-pointer transition-all duration-700 ${className}`}
      style={glassStyle}
    >
      {/* Glass Layers */}
      <div
        className="absolute inset-0 z-0 overflow-hidden"
        style={{
          backdropFilter: "blur(3px)",
          filter: "url(#glass-distortion)",
          isolation: "isolate",
          borderRadius: "inherit",
        }}
      />
      <div
        className="absolute inset-0 z-10"
        style={{ background: "rgba(255, 255, 255, 0.15)", borderRadius: "inherit" }}
      />
      <div
        className="absolute inset-0 z-20 overflow-hidden"
        style={{
          boxShadow:
            "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.3), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.2)",
          borderRadius: "inherit",
        }}
      />

      {/* Content */}
      <div className="relative z-30">{children}</div>
    </div>
  );
};

const NAV_ITEMS = [
  { href: '/', label: 'Hub', icon: '🏠', id: 'hub' },
  { href: '/calendario', label: 'Calendario', icon: '📅', id: 'calendario' },
  { href: '/classifica', label: 'Classifica', icon: '🏆', id: 'classifica' },
];

export default function LiquidNav({ activePage }: { activePage: string }) {
  return (
    <>
      <div className="fixed bottom-4 left-0 right-0 z-[200] flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto">
          <GlassEffect className="rounded-[2.5rem] p-2.5 hover:p-3 transition-all duration-700">
            <div className="flex items-center justify-center gap-2 rounded-[2.5rem] px-1 overflow-hidden">
              {NAV_ITEMS.map((item, index) => {
                const isActive = activePage === item.id;
                return (
                  <a
                    key={index}
                    href={item.href}
                    className={`flex flex-col items-center justify-center w-[4.5rem] h-[4.5rem] rounded-[1.8rem] transition-all duration-700 hover:scale-110 cursor-pointer ${
                      isActive ? 'bg-[rgba(59,130,246,0.3)] shadow-[inset_0_1px_4px_rgba(255,255,255,0.4)]' : 'hover:bg-[rgba(255,255,255,0.1)]'
                    }`}
                    style={{
                      transformOrigin: "center center",
                      transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
                      textDecoration: "none"
                    }}
                  >
                    <span className="text-[1.8rem] drop-shadow-md" style={{ filter: isActive ? 'drop-shadow(0 0 8px rgba(255,255,255,0.6))' : 'none' }}>
                      {item.icon}
                    </span>
                    <span className={`text-[0.65rem] mt-1 font-bold tracking-wide ${isActive ? 'text-white drop-shadow-md' : 'text-white/70'}`}>
                      {item.label}
                    </span>
                  </a>
                );
              })}
            </div>
          </GlassEffect>
        </div>
      </div>
    </>
  );
}
