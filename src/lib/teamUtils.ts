export const AVATAR_INITIALS = (name: string) => {
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    const first = parts[0][0] || '';
    const second = parts[1][0] || '';
    return (first + second).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const AVATAR_IDX: Record<string, number> = {
  'Amatori Calcio Genova': 0,
  'Tama': 1,
  'Mario': 2,
  'Sezione 104': 3,
  'Gli Umili': 4,
  'Aston Birra': 5,
  'Taverna': 6,
  'UCG (Bairon)': 7,
  'Lo Dico FC': 8,
  'chainz': 9,
  'FcPontos': 10,
};

export function getTeamLogo(teamName: string): string | null {
  if (!teamName) return null;
  const name = teamName.toLowerCase().trim();
  
  if (name.includes('amatori') || name.includes('genova')) return '/Logos/Amatori Calcio Genova.jpeg';
  if (name.includes('ucg') || name.includes('ugc')) return '/Logos/U.C.G.jpeg';
  if (name.includes('umili')) return '/Logos/GliUmili.jpeg';
  if (name.includes('taverna')) return '/Logos/Taverna.jpeg';
  if (name.includes('ceres')) return '/Logos/FCCeres.jpeg';
  if (name.includes('aston')) return '/Logos/Astonbirra.jpeg';
  if (name.includes('chainz')) return '/Logos/Chainz.jpeg';
  if (name.includes('pontos')) return '/Logos/FcPontos.jpeg';
  if (name.includes('gilly')) return '/Logos/GillyBoys.jpeg';
  if (name.includes('murta')) return '/Logos/Murta.jpeg';
  if (name.includes('ketzmaja') || name.includes('teodoro')) return '/Logos/SanTeodoroKetzmaja.jpeg';
  if (name.includes('sezione')) return '/Logos/Sezione.jpeg';
  if (name.includes('dico')) return '/Logos/loDicoFC.jpeg';
  
  return null;
}

export function parsePlayerName(name: string): { displayName: string; isExtra: boolean } {
  if (!name) return { displayName: '', isExtra: false };
  const hasExtra = name.includes('(Slot Extra)') || name.includes('(Extra)');
  let displayName = name;
  if (hasExtra) {
    displayName = name.replace(/\(Slot Extra\)/g, '').replace(/\(Extra\)/g, '').trim();
  }
  return { displayName, isExtra: hasExtra };
}
