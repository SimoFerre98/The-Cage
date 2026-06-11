import React, { useState, useEffect } from "react";
import GlassEffect from './GlassEffect';

/**
 * TopBar con effetto Liquid Glass e Toggle Day/Night:
 * - centrata, larghezza contenuta, altezza generosa
 * - pulsante Toggle Tema a sinistra
 * - logo + titolo al centro
 * - icona admin a destra
 */
export default function TopBar() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    // Controllo iniziale del tema
    const isLight = document.documentElement.classList.contains("light-theme");
    setTheme(isLight ? "light" : "dark");
  }, []);

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.add("light-theme");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.remove("light-theme");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  return (
    <GlassEffect
      className="rounded-[1.6rem] px-5 py-4"
      style={{ border: '1px solid var(--glass-border-light)' }}
    >
      <div className="relative flex items-center justify-center w-full">
        {/* Theme Toggle Button (Left) */}
        <button
          onClick={toggleTheme}
          aria-label="Cambia tema"
          style={{
            position: 'absolute',
            left: 0,
            background: 'transparent',
            border: 'none',
            fontSize: '1.1rem',
            cursor: 'pointer',
            opacity: 0.6,
            transition: 'opacity 0.3s, transform 0.3s',
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px',
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '0.6')}
          className="hover:scale-115 active:scale-90 transition-all duration-300"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* Logo + titolo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/Logo_Torneo.webp"
            alt="Logo Torneo"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
          />
          <span
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            Memorial Gerry The Cage
          </span>
        </div>

        {/* Icona admin */}
        <a
          href="/admin"
          aria-label="Area Admin"
          style={{
            position: 'absolute',
            right: 0,
            textDecoration: 'none',
            opacity: 0.4,
            transition: 'opacity 0.3s',
            padding: '4px',
            display: 'inline-flex',
            alignItems: 'center',
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '0.4')}
        >
          <span style={{ fontSize: '1.15rem', display: 'inline-block' }}>⚙️</span>
        </a>
      </div>
    </GlassEffect>
  );
}
