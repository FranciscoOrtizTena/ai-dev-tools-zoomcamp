export type GameMode = 'pass-through' | 'walls';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Point {
  x: number;
  y: number;
}

export interface LeaderboardEntry {
  player: string;
  bestScore: number;
  totalRuns: number;
  modeBreakdown: Record<GameMode, number>;
}

export interface SpectatorSnapshot {
  id: string;
  player: string;
  mode: GameMode;
  snake: Point[];
  food: Point;
  score: number;
  gridSize: number;
  updatedAt: number;
}

export interface UserProfile {
  id: string;
  username: string;
}

export interface Session {
  token: string;
  user: UserProfile;
}
