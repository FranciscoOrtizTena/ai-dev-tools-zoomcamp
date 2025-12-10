import { useCallback, useEffect, useState } from 'react';
import SnakeGame from './components/SnakeGame';
import AuthPanel from './components/AuthPanel';
import Leaderboard from './components/Leaderboard';
import SpectatorPanel from './components/SpectatorPanel';
import { GameMode, LeaderboardEntry, Session } from './types';
import { mockApi } from './services/mockApi';
import './App.css';

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  const refreshLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    try {
      const entries = await mockApi.fetchLeaderboard();
      setLeaderboard(entries);
    } catch (error) {
      setLeaderboardError(error instanceof Error ? error.message : 'Failed to load leaderboard');
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  const handleScoreSubmit = useCallback(
    async (score: number, mode: GameMode) => {
      if (!session) {
        return;
      }
      try {
        await mockApi.recordScore({ username: session.user.username, score, mode });
        await refreshLeaderboard();
      } catch (error) {
        console.error('Failed to record score', error);
      }
    },
    [refreshLeaderboard, session]
  );

  const login = useCallback(async (username: string, password: string) => {
    const trimmed = username.trim();
    if (!trimmed) {
      throw new Error('Username is required');
    }
    const nextSession = await mockApi.login(trimmed, password);
    setSession(nextSession);
  }, []);

  const signUp = useCallback(
    async (username: string, password: string) => {
      const trimmed = username.trim();
      if (!trimmed) {
        throw new Error('Username is required');
      }
      const nextSession = await mockApi.signUp(trimmed, password);
      setSession(nextSession);
      await refreshLeaderboard();
    },
    [refreshLeaderboard]
  );

  const logout = () => setSession(null);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Snake Ops Control Room</h1>
          <p className="tagline">Experiment with pass-through and wall models while spectating rivals.</p>
        </div>
        {session && <p className="session-indicator">Signed in as {session.user.username}</p>}
      </header>
      <main className="app-main">
        <section className="primary-column">
          <SnakeGame username={session?.user.username} onScoreSubmit={handleScoreSubmit} />
          <SpectatorPanel />
        </section>
        <section className="sidebar">
          <AuthPanel session={session} onLogin={login} onSignup={signUp} onLogout={logout} />
          <Leaderboard
            entries={leaderboard}
            loading={leaderboardLoading}
            error={leaderboardError}
            onRefresh={refreshLeaderboard}
            currentUser={session?.user.username}
          />
        </section>
      </main>
    </div>
  );
};

export default App;
