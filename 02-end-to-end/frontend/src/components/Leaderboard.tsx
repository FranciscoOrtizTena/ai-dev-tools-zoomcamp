import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  currentUser?: string;
}

const Leaderboard = ({ entries, loading, error, onRefresh, currentUser }: LeaderboardProps) => (
  <div className="panel leaderboard">
    <div className="panel-header">
      <div>
        <h2>Leaderboard</h2>
        <p className="subtitle">Best scores are tracked per pilot.</p>
      </div>
      <button onClick={onRefresh} disabled={loading}>
        {loading ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
    {error && <p className="error-text">{error}</p>}
    <ul className="leaderboard-list">
      {entries.map((entry, index) => {
        const isCurrent = currentUser && entry.player === currentUser;
        return (
          <li key={entry.player} className={isCurrent ? 'highlight' : ''}>
            <div className="position">#{index + 1}</div>
            <div>
              <strong>{entry.player}</strong>
              <p>
                Best score {entry.bestScore} · Runs {entry.totalRuns} · Walls {entry.modeBreakdown.walls} · Pass-through {entry.modeBreakdown['pass-through']}
              </p>
            </div>
          </li>
        );
      })}
      {entries.length === 0 && !loading && (
        <li className="empty" key="empty">
          No runs recorded yet.
        </li>
      )}
    </ul>
  </div>
);

export default Leaderboard;
