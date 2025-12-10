import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { SpectatorSnapshot } from '../types';

const SpectatorPanel = () => {
  const [games, setGames] = useState<SpectatorSnapshot[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = apiClient.subscribeToSpectatorStream(
      (snapshots) => {
        setGames(snapshots);
        setError(null);
      },
      (message) => setError(message)
    );
    return unsubscribe;
  }, []);

  const manualRefresh = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const latest = await apiClient.fetchSpectatorSnapshots();
      setGames(latest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sync');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="panel spectator-panel">
      <div className="panel-header">
        <div>
          <h2>Watch live runs</h2>
          <p className="subtitle">We simulate three pilots so you can follow their moves.</p>
        </div>
        <button onClick={manualRefresh} disabled={isSyncing}>
          {isSyncing ? 'Syncing…' : 'Sync now'}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="spectator-grid">
        {games.map((game) => {
          const cells: JSX.Element[] = [];
          const snakeKeys = new Set(game.snake.map((segment) => `${segment.x}-${segment.y}`));
          for (let y = 0; y < game.gridSize; y += 1) {
            for (let x = 0; x < game.gridSize; x += 1) {
              const key = `${game.id}-${x}-${y}`;
              const isSnake = snakeKeys.has(`${x}-${y}`);
              const isHead = isSnake && game.snake[0].x === x && game.snake[0].y === y;
              const isFood = game.food.x === x && game.food.y === y;
              cells.push(
                <div key={key} className={`mini-cell${isSnake ? ' snake' : ''}${isHead ? ' head' : ''}${isFood ? ' food' : ''}`} />
              );
            }
          }
          return (
            <div key={game.id} className="spectator-card">
              <div className="card-header">
                <strong>{game.player}</strong>
                <span className={`mode-pill ${game.mode}`}>{game.mode === 'walls' ? 'Walls' : 'Pass'}</span>
              </div>
              <div className="mini-board" style={{ gridTemplateColumns: `repeat(${game.gridSize}, 1fr)` }}>
                {cells}
              </div>
              <div className="card-footer">
                <span>Score {game.score}</span>
                <small>Updated {new Date(game.updatedAt).toLocaleTimeString()}</small>
              </div>
            </div>
          );
        })}
        {games.length === 0 && <p>No pilots are live right now.</p>}
      </div>
    </div>
  );
};

export default SpectatorPanel;
