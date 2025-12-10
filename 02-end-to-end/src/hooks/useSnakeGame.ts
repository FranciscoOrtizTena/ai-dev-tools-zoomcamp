import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { advanceState, createInitialState, EngineState } from '../game/engine';
import { Direction, GameMode } from '../types';

type GameStatus = 'idle' | 'running' | 'paused' | 'over';

interface UseSnakeGameOptions {
  gridSize?: number;
  initialMode?: GameMode;
  speedMs?: number;
}

export const useSnakeGame = ({
  gridSize = 15,
  initialMode = 'walls',
  speedMs = 180
}: UseSnakeGameOptions = {}) => {
  const [mode, setMode] = useState<GameMode>(initialMode);
  const initialState = useMemo(() => createInitialState({ mode, gridSize }), [mode, gridSize]);
  const [state, setState] = useState<EngineState>(initialState);
  const [status, setStatus] = useState<GameStatus>('idle');
  const requestedDirection = useRef<Direction | undefined>(undefined);

  useEffect(() => {
    setState(initialState);
    setStatus('idle');
    requestedDirection.current = undefined;
  }, [initialState]);

  const tick = useCallback(() => {
    setState((prev) => {
      const next = advanceState(prev, requestedDirection.current);
      requestedDirection.current = undefined;
      if (next.isGameOver && prev !== next) {
        setStatus('over');
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (status !== 'running') {
      return;
    }
    const interval = window.setInterval(() => tick(), speedMs);
    return () => window.clearInterval(interval);
  }, [speedMs, status, tick]);

  const changeDirection = (direction: Direction) => {
    requestedDirection.current = direction;
  };

  const start = () => {
    if (status === 'running') {
      return;
    }
    if (state.isGameOver) {
      requestedDirection.current = undefined;
      setState(createInitialState({ mode, gridSize }));
      setStatus('running');
      return;
    }
    setStatus('running');
    tick();
  };

  const pause = () => {
    if (status === 'running') {
      setStatus('paused');
    }
  };

  const reset = () => {
    requestedDirection.current = undefined;
    setState(createInitialState({ mode, gridSize }));
    setStatus('idle');
  };

  const switchMode = (nextMode: GameMode) => {
    setMode(nextMode);
  };

  return {
    state,
    mode,
    status,
    start,
    pause,
    reset,
    changeDirection,
    setMode: switchMode,
    gridSize
  };
};
