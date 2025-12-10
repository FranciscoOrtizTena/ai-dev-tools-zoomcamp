import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSnakeGame } from '../hooks/useSnakeGame';
import { Direction, GameMode } from '../types';

interface SnakeGameProps {
  username?: string;
  onScoreSubmit: (score: number, mode: GameMode) => void;
}

const directionByKey: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right'
};

const SnakeGame = ({ username, onScoreSubmit }: SnakeGameProps) => {
  const { state, status, start, pause, reset, changeDirection, setMode, mode, gridSize } = useSnakeGame({
    initialMode: 'walls',
    gridSize: 16
  });
  const scorePosted = useRef<number | null>(null);

  const handleDirection = useCallback(
    (direction: Direction) => {
      changeDirection(direction);
      if (status === 'idle') {
        start();
      }
    },
    [changeDirection, start, status]
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (directionByKey[event.key]) {
        event.preventDefault();
        handleDirection(directionByKey[event.key]);
      }
      if (event.key === ' ') {
        event.preventDefault();
        status === 'running' ? pause() : start();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleDirection, pause, start, status]);

  useEffect(() => {
    if (state.isGameOver) {
      if (scorePosted.current !== state.score) {
        onScoreSubmit(state.score, state.mode);
        scorePosted.current = state.score;
      }
    } else {
      scorePosted.current = null;
    }
  }, [onScoreSubmit, state]);

  const boardCells = useMemo(() => {
    const cells = [] as JSX.Element[];
    const snakeKeys = new Set(state.snake.map((segment) => `${segment.x}-${segment.y}`));
    for (let y = 0; y < gridSize; y += 1) {
      for (let x = 0; x < gridSize; x += 1) {
        const key = `${x}-${y}`;
        const isSnake = snakeKeys.has(key);
        const isHead = isSnake && state.snake[0].x === x && state.snake[0].y === y;
        const isFood = state.food.x === x && state.food.y === y;
        cells.push(
          <div
            key={key}
            className={`cell${isSnake ? ' snake' : ''}${isHead ? ' head' : ''}${isFood ? ' food' : ''}`}
          />
        );
      }
    }
    return cells;
  }, [gridSize, state.food, state.snake]);

  return (
    <div className="panel snake-game">
      <div className="game-header">
        <div>
          <h2>Snake Arena</h2>
          <p className="subtitle">Mode: {mode === 'walls' ? 'Walls' : 'Pass-through'}</p>
        </div>
        <div className={`status-pill ${status}`}>
          <span>{status.toUpperCase()}</span>
        </div>
      </div>
      {username && <p className="welcome">Pilot: {username}</p>}
      <div className="mode-selector">
        <label htmlFor="mode-select">Game model</label>
        <select
          id="mode-select"
          value={mode}
          onChange={(event) => setMode(event.target.value as GameMode)}
        >
          <option value="walls">Walls</option>
          <option value="pass-through">Pass-through</option>
        </select>
      </div>
      <div className="board" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {boardCells}
      </div>
      <div className="game-info">
        <div>
          <strong>Length</strong>
          <span>{state.snake.length}</span>
        </div>
        <div>
          <strong>Score</strong>
          <span>{state.score}</span>
        </div>
        <div>
          <strong>Mode</strong>
          <span>{mode}</span>
        </div>
      </div>
      <div className="controls">
        <button onClick={start} disabled={status === 'running'}>
          Start
        </button>
        <button onClick={pause} disabled={status !== 'running'}>
          Pause
        </button>
        <button onClick={reset}>Reset</button>
      </div>
      <div className="touch-controls">
        <button aria-label="Move up" onClick={() => handleDirection('up')}>
          ↑
        </button>
        <div className="horizontal-controls">
          <button aria-label="Move left" onClick={() => handleDirection('left')}>
            ←
          </button>
          <button aria-label="Move right" onClick={() => handleDirection('right')}>
            →
          </button>
        </div>
        <button aria-label="Move down" onClick={() => handleDirection('down')}>
          ↓
        </button>
      </div>
      <p className="hint">Use arrow keys to steer. Space toggles pause.</p>
    </div>
  );
};

export default SnakeGame;
