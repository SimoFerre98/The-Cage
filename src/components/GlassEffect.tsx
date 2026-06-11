import React, { useRef } from "react";

export interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  style?: React.CSSProperties;
}

const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = "",
  contentClassName = "",
  style = {},
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  };

  const glassStyle = {
    boxShadow: "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`relative flex font-semibold overflow-hidden text-[var(--text-primary)] transition-all duration-700 group/glass ${className}`}
      style={glassStyle}
    >
      {/* Glass Layers */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          borderRadius: "inherit",
        }}
      />
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: "var(--glass-bg)",
          borderRadius: "inherit",
        }}
      />

      {/* Spotlight Hover Glow Layer */}
      <div
        className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover/glass:opacity-100 transition-opacity duration-300"
        style={{
          background: "radial-gradient(150px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(255, 255, 255, 0.08), transparent 80%)",
          borderRadius: "inherit",
        }}
      />

      {/* Glowing Border Layer */}
      <div
        className="absolute inset-0 z-25 pointer-events-none opacity-0 group-hover/glass:opacity-100 transition-opacity duration-300"
        style={{
          border: "1px solid transparent",
          borderRadius: "inherit",
          background: "radial-gradient(120px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(59, 130, 246, 0.35), rgba(139, 92, 246, 0.1) 60%, transparent 100%) border-box",
          WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "destination-out",
          maskComposite: "exclude",
        }}
      />

      {/* Inner Glow Border */}
      <div
        className="absolute inset-0 z-30 overflow-hidden pointer-events-none"
        style={{
          boxShadow:
            "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.3), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.2)",
          borderRadius: "inherit",
        }}
      />

      {/* Content */}
      <div className={`relative z-40 w-full ${contentClassName}`}>{children}</div>
    </div>
  );
};

export default GlassEffect;
