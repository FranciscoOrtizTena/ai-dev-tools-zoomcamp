import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockApi } from './mockApi';

describe('mockApi service', () => {
  beforeEach(() => {
    mockApi.__reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('signs up a user and blocks duplicates', async () => {
    const session = await mockApi.signUp('tester', 'secret');
    expect(session.user.username).toBe('tester');
    await expect(mockApi.signUp('tester', 'secret')).rejects.toThrow('User already exists');
  });

  it('fails login with wrong password', async () => {
    await mockApi.signUp('pilot', '1234');
    await expect(mockApi.login('pilot', 'bad')).rejects.toThrow('Invalid credentials');
  });

  it('records scores and exposes them via the leaderboard', async () => {
    await mockApi.signUp('runner', 'pass');
    await mockApi.recordScore({ username: 'runner', score: 9, mode: 'walls' });
    const leaderboard = await mockApi.fetchLeaderboard();
    const entry = leaderboard.find((row) => row.player === 'runner');
    expect(entry).toBeDefined();
    expect(entry?.bestScore).toBe(9);
    expect(entry?.modeBreakdown.walls).toBe(1);
  });

  it('pushes spectator updates to subscribers', async () => {
    vi.useFakeTimers();
    const listener = vi.fn();
    const unsubscribe = mockApi.subscribeToSpectatorFeed(listener);
    expect(listener).toHaveBeenCalled();
    listener.mockClear();
    vi.advanceTimersByTime(1600);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });
});
