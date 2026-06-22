export interface Team {
  id: string;
  name: string;
  region: string;
  flag: string; // Emoji flag or code
  logoBg: string; // Tailwind class like "from-blue-500 to-indigo-600"
  textColor: string; // "text-blue-200" etc
  borderColor: string; // Border color
  initials: string;
  logoUrl?: string;
}

export interface Pool {
  id: string;
  name: string;
  description: string;
  teams: Team[];
  isActive: boolean; // Whether the pool is active (for 18-team draw)
}

export interface Group {
  id: string;
  name: string;
  teams: Team[];
}

export interface DrawHistoryEntry {
  id: string;
  timestamp: string;
  format: string;
  groups: { [key: string]: Team[] };
}
