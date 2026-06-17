/** Tipi condivisi per l'area amministrativa */

export interface Player {
  id: string;
  name: string;
  team_id: string;
  role?: string | null;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
}

export interface Match {
  id: string;
  match_date: string;
  round: string;
  status: 'PROSSIMA' | 'LIVE' | 'TERMINATA';
  home_score: number;
  away_score: number;
  home_team_id: string;
  away_team_id: string;
  home_team: { id: string; name: string };
  away_team: { id: string; name: string };
}

/** Props iniettate da Dashboard ai componenti figli */
export interface AdminChildProps {
  teams: Team[];
  /** Lista piatta di tutti i giocatori (estratta dal join con teams) */
  players: Player[];
  matches: Match[];
  onRefreshTeams: () => Promise<void>;
  onRefreshMatches: () => Promise<void>;
}
