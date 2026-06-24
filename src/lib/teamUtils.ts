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
  'Sezione 164': 3,
  'Gli Umili': 4,
  'Aston Birra': 5,
  'Taverna': 6,
  'UCG (Bairon)': 7,
  'U.C.G': 7,
  'Lo Dico FC': 8,
  'chainz': 9,
  'Chainz': 9,
  'FcPontos': 10,
  'Fc Pontos': 10,
};

export function getTeamLogo(teamName: string): string | null {
  if (!teamName) return null;
  const name = teamName.toLowerCase().trim().replace(/\./g, '');
  
  if (name.includes('amatori') || name.includes('genova')) return '/Logos/amatoricalcio.webp';
  if (name.includes('ucg') || name.includes('ugc')) return '/Logos/UCG.webp';
  if (name.includes('umili')) return '/Logos/umili.webp';
  if (name.includes('taverna')) return '/Logos/taverna.webp';
  if (name.includes('ceres')) return '/Logos/ceres.webp';
  if (name.includes('aston')) return '/Logos/aston birra.webp';
  if (name.includes('chainz')) return '/Logos/chainz.webp';
  if (name.includes('pontos')) return '/Logos/FcPontos.webp';
  if (name.includes('gilly')) return '/Logos/gilly.webp';
  if (name.includes('murta')) return '/Logos/murta.webp';
  if (name.includes('ketzmaja') || name.includes('teodoro')) return '/Logos/teodoro.webp';
  if (name.includes('sezione')) return '/Logos/sezione.webp';
  if (name.includes('dico')) return '/Logos/lodico.webp';
  if (name.includes('pontex') || name.includes('pirates')) return '/Logos/pirates.webp';
  
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
