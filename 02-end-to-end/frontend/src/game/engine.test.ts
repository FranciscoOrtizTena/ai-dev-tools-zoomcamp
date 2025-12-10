import { advanceState, createInitialState, sanitizeDirection } from './engine';

describe('Snake engine', () => {
  it('generates initial state with snake and food', () => {
    const initial = createInitialState({ mode: 'walls', gridSize: 10 });
    expect(initial.snake.length).toBeGreaterThan(0);
    expect(initial.food).toBeDefined();
    expect(initial.isGameOver).toBe(false);
  });

  it('wraps around the board in pass-through mode', () => {
    const initial = createInitialState({ mode: 'pass-through', gridSize: 5 });
    const state = {
      ...initial,
      snake: [
        { x: 4, y: 2 },
        { x: 3, y: 2 },
        { x: 2, y: 2 }
      ],
      food: { x: 0, y: 0 },
      direction: 'right'
    };
    const next = advanceState(state);
    expect(next.snake[0]).toEqual({ x: 0, y: 2 });
    expect(next.isGameOver).toBe(false);
  });

  it('ends the game on wall collision in walls mode', () => {
    const initial = createInitialState({ mode: 'walls', gridSize: 5 });
    const state = {
      ...initial,
      snake: [
        { x: 0, y: 0 },
        { x: 0, y: 1 }
      ],
      direction: 'up'
    };
    const next = advanceState(state);
    expect(next.isGameOver).toBe(true);
  });

  it('increases score and grows when food is eaten', () => {
    const initial = createInitialState({ mode: 'walls', gridSize: 8 });
    const state = {
      ...initial,
      snake: [
        { x: 3, y: 3 },
        { x: 2, y: 3 },
        { x: 1, y: 3 }
      ],
      direction: 'right',
      food: { x: 4, y: 3 }
    };
    const next = advanceState(state);
    expect(next.snake.length).toBe(state.snake.length + 1);
    expect(next.score).toBe(state.score + 1);
  });

  it('prevents reversing direction immediately', () => {
    expect(sanitizeDirection('up', 'down')).toBe('up');
    expect(sanitizeDirection('left', 'right')).toBe('left');
    expect(sanitizeDirection('up', 'left')).toBe('left');
  });
});
