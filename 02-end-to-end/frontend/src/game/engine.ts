import { Direction, GameMode, Point } from '../types';

const directionVectors: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

export interface GameConfig {
  mode: GameMode;
  gridSize?: number;
}

export interface EngineState {
  snake: Point[];
  food: Point;
  direction: Direction;
  score: number;
  isGameOver: boolean;
  mode: GameMode;
  gridSize: number;
}

export const createInitialState = ({ mode, gridSize = 15 }: GameConfig): EngineState => {
  const center = Math.floor(gridSize / 2);
  const snake: Point[] = [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center }
  ];

  return {
    snake,
    food: generateFood(snake, gridSize),
    direction: 'right',
    score: 0,
    isGameOver: false,
    mode,
    gridSize
  };
};

export const sanitizeDirection = (current: Direction, next: Direction): Direction => {
  if (
    (current === 'up' && next === 'down') ||
    (current === 'down' && next === 'up') ||
    (current === 'left' && next === 'right') ||
    (current === 'right' && next === 'left')
  ) {
    return current;
  }
  return next;
};

const wrapPoint = (point: Point, gridSize: number): Point => ({
  x: (point.x + gridSize) % gridSize,
  y: (point.y + gridSize) % gridSize
});

const equals = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

const collides = (snake: Point[], point: Point) => snake.some((segment) => equals(segment, point));

export const generateFood = (snake: Point[], gridSize: number): Point => {
  const totalCells = gridSize * gridSize;
  if (snake.length >= totalCells) {
    return snake[0];
  }

  let attempt = 0;
  while (attempt < totalCells * 2) {
    const candidate = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize)
    };
    if (!collides(snake, candidate)) {
      return candidate;
    }
    attempt += 1;
  }
  return { x: 0, y: 0 };
};

export const advanceState = (state: EngineState, requested?: Direction): EngineState => {
  if (state.isGameOver) {
    return state;
  }

  const direction = requested ? sanitizeDirection(state.direction, requested) : state.direction;
  const movement = directionVectors[direction];
  const nextHead: Point = {
    x: state.snake[0].x + movement.x,
    y: state.snake[0].y + movement.y
  };

  let adjustedHead = nextHead;

  if (state.mode === 'pass-through') {
    adjustedHead = wrapPoint(nextHead, state.gridSize);
  } else if (
    adjustedHead.x < 0 ||
    adjustedHead.x >= state.gridSize ||
    adjustedHead.y < 0 ||
    adjustedHead.y >= state.gridSize
  ) {
    return {
      ...state,
      direction,
      isGameOver: true
    };
  }

  if (collides(state.snake, adjustedHead)) {
    return {
      ...state,
      direction,
      isGameOver: true
    };
  }

  const consumedFood = equals(adjustedHead, state.food);
  const grownSnake = consumedFood
    ? [adjustedHead, ...state.snake]
    : [adjustedHead, ...state.snake.slice(0, -1)];

  return {
    ...state,
    snake: grownSnake,
    food: consumedFood ? generateFood(grownSnake, state.gridSize) : state.food,
    direction,
    score: consumedFood ? state.score + 1 : state.score
  };
};
