import { GameMode, LeaderboardEntry, Session, SpectatorSnapshot } from '../types';

const DEFAULT_API_BASE_URL = 'http://localhost:8000';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

const extractErrorMessage = async (response: Response) => {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = (await response.json()) as { message?: string };
      if (data?.message) {
        return data.message;
      }
    }
  } catch (error) {
    console.error('Failed to parse error response', error);
  }
  return `Request failed with status ${response.status}`;
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return undefined as T;
};

export const apiClient = {
  async login(username: string, password: string): Promise<Session> {
    return request<Session>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  async signUp(username: string, password: string): Promise<Session> {
    return request<Session>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  async fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    return request<LeaderboardEntry[]>('/leaderboard');
  },
  async recordScore(params: { username: string; score: number; mode: GameMode; token?: string }): Promise<void> {
    const { token, ...body } = params;
    return request<void>('/scores', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify(body)
    });
  },
  async fetchSpectatorSnapshots(): Promise<SpectatorSnapshot[]> {
    return request<SpectatorSnapshot[]>('/spectator/snapshots');
  },
  subscribeToSpectatorStream(
    onData: (snapshots: SpectatorSnapshot[]) => void,
    onError?: (message: string) => void
  ): () => void {
    if (typeof EventSource === 'undefined') {
      onError?.('Live streaming is not supported in this browser.');
      return () => undefined;
    }

    const eventSource = new EventSource(buildUrl('/spectator/stream'));

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as SpectatorSnapshot[];
        onData(payload);
      } catch (error) {
        console.error('Failed to parse spectator payload', error);
        onError?.('Received an invalid spectator update.');
      }
    };

    eventSource.onerror = () => {
      onError?.('Lost connection to spectator stream.');
      eventSource.close();
    };

    return () => eventSource.close();
  }
};

export type ApiClient = typeof apiClient;
