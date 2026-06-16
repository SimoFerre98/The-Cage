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
  'Corsi': 3,
  'Montarsolo': 4,
  'Dario': 5,
  'Taverna': 6,
  'UCG (Bairon)': 7,
  'Samu Betti': 8,
  'chainz Andrea Robbiano': 9,
  'Martino Gonzalez': 10,
};

export function getTeamLogo(teamName: string): string | null {
  if (!teamName) return null;
  const name = teamName.toLowerCase().trim();
  
  if (name.includes('astonbirra')) return '/Logos/Astonbirra.jpeg';
  if (name.includes('chainz')) return '/Logos/Chainz.jpeg';
  if (name.includes('pontos')) return '/Logos/FcPontos.jpeg';
  if (name.includes('gilly')) return '/Logos/GillyBoys.jpeg';
  if (name.includes('murta')) return '/Logos/Murta.jpeg';
  if (name.includes('ketzmaja') || name.includes('teodoro')) return '/Logos/SanTeodoroKetzmaja.jpeg';
  if (name.includes('sezione')) return '/Logos/Sezione.jpeg';
  
  return null;
}
