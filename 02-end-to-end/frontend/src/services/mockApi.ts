import { advanceState, createInitialState, EngineState } from '../game/engine';
import { Direction, GameMode, LeaderboardEntry, Session, SpectatorSnapshot, UserProfile } from '../types';

interface StoredUser {
  id: string;
  username: string;
  password: string;
  bestScore: number;
  totalRuns: number;
  modeBreakdown: Record<GameMode, number>;
}

const mockUsers = new Map<string, StoredUser>();
const directions: Direction[] = ['up', 'down', 'left', 'right'];
let tokenCounter = 1;

const seedUsers = () => {
  const seeds = [
    { username: 'nova', password: 'nova' },
    { username: 'orbit', password: 'orbit' },
    { username: 'lumen', password: 'lumen' }
  ];

  seeds.forEach((seed, index) => {
    const normalized = seed.username.toLowerCase();
    mockUsers.set(normalized, {
      id: `seed-${index}`,
      username: seed.username,
      password: seed.password,
      bestScore: Math.floor(Math.random() * 30) + 5,
      totalRuns: 4 + index,
      modeBreakdown: {
        'pass-through': 2,
        walls: 2 + index
      }
    });
  });
};

if (mockUsers.size === 0) {
  seedUsers();
}

const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

const createSession = (user: StoredUser): Session => ({
  token: `session-${tokenCounter++}`,
  user: { id: user.id, username: user.username }
});

const spectatorNames = ['Drift', 'Echo', 'Pulse'];
const spectatorGridSize = 12;
let spectatorStates: EngineState[] = spectatorNames.map((_, index) =>
  createInitialState({
    mode: index % 2 === 0 ? 'walls' : 'pass-through',
    gridSize: spectatorGridSize
  })
);

const toSpectatorSnapshot = (state: EngineState, index: number): SpectatorSnapshot => ({
  id: `spectator-${index}`,
  player: spectatorNames[index],
  mode: state.mode,
  snake: state.snake.map((segment) => ({ ...segment })),
  food: { ...state.food },
  score: state.score,
  gridSize: state.gridSize,
  updatedAt: Date.now()
});

const advanceSpectators = () => {
  spectatorStates = spectatorStates.map((state) => {
    if (state.isGameOver) {
      return createInitialState({ mode: state.mode, gridSize: state.gridSize });
    }
    const direction = directions[Math.floor(Math.random() * directions.length)];
    return advanceState(state, direction);
  });
};

const subscribers = new Set<(snapshots: SpectatorSnapshot[]) => void>();
let spectatorTimer: ReturnType<typeof setInterval> | null = null;

const ensureSpectatorLoop = () => {
  if (!spectatorTimer) {
    spectatorTimer = setInterval(() => {
      advanceSpectators();
      const payload = spectatorStates.map(toSpectatorSnapshot);
      subscribers.forEach((subscriber) => subscriber(payload));
    }, 1500);
  }
};

const stopSpectatorLoop = () => {
  if (spectatorTimer && subscribers.size === 0) {
    clearInterval(spectatorTimer);
    spectatorTimer = null;
  }
};

export const mockApi = {
  async login(username: string, password: string): Promise<Session> {
    await delay();
    const user = mockUsers.get(username.toLowerCase());
    if (!user || user.password !== password) {
      throw new Error('Invalid credentials');
    }
    return createSession(user);
  },
  async signUp(username: string, password: string): Promise<Session> {
    await delay();
    const normalized = username.toLowerCase();
    if (mockUsers.has(normalized)) {
      throw new Error('User already exists');
    }
    const stored: StoredUser = {
      id: `user-${mockUsers.size + 1}`,
      username: normalized,
      password,
      bestScore: 0,
      totalRuns: 0,
      modeBreakdown: {
        'pass-through': 0,
        walls: 0
      }
    };
    mockUsers.set(normalized, stored);
    return createSession(stored);
  },
  async fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    await delay();
    return Array.from(mockUsers.values())
      .map<LeaderboardEntry>((user) => ({
        player: user.username,
        bestScore: user.bestScore,
        totalRuns: user.totalRuns,
        modeBreakdown: user.modeBreakdown
      }))
      .sort((a, b) => b.bestScore - a.bestScore);
  },
  async recordScore({ username, score, mode }: { username: string; score: number; mode: GameMode }): Promise<void> {
    await delay(200);
    const user = mockUsers.get(username.toLowerCase());
    if (!user) {
      throw new Error('Player not found');
    }
    user.totalRuns += 1;
    user.modeBreakdown[mode] += 1;
    user.bestScore = Math.max(user.bestScore, score);
  },
  async fetchSpectatorSnapshots(): Promise<SpectatorSnapshot[]> {
    await delay(150);
    advanceSpectators();
    return spectatorStates.map(toSpectatorSnapshot);
  },
  subscribeToSpectatorFeed(callback: (snapshots: SpectatorSnapshot[]) => void): () => void {
    subscribers.add(callback);
    ensureSpectatorLoop();
    callback(spectatorStates.map(toSpectatorSnapshot));

    return () => {
      subscribers.delete(callback);
      stopSpectatorLoop();
    };
  },
  __reset() {
    mockUsers.clear();
    seedUsers();
    spectatorStates = spectatorNames.map((_, index) =>
      createInitialState({ mode: index % 2 === 0 ? 'walls' : 'pass-through', gridSize: spectatorGridSize })
    );
    subscribers.clear();
    if (spectatorTimer) {
      clearInterval(spectatorTimer);
      spectatorTimer = null;
    }
  }
};
