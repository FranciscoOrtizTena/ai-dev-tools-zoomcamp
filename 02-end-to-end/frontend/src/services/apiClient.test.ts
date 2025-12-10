import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('apiClient', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('posts credentials to the login endpoint', async () => {
    const payload = { token: 'abc', user: { id: '1', username: 'pilot' } };
    fetchMock.mockResolvedValue(jsonResponse(payload));

    const session = await apiClient.login('pilot', 'secret');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'pilot', password: 'secret' })
      })
    );
    expect(session).toEqual(payload);
  });

  it('surfaces API error messages', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Invalid credentials' }, 401));

    await expect(apiClient.login('pilot', 'wrong')).rejects.toThrow('Invalid credentials');
  });

  it('records scores with optional auth token', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await apiClient.recordScore({ username: 'pilot', score: 12, mode: 'walls', token: 'token-123' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/scores',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-123' })
      })
    );
  });

  it('fetches spectator snapshots', async () => {
    const snapshots = [
      {
        id: 's1',
        player: 'Echo',
        mode: 'walls' as const,
        snake: [{ x: 1, y: 1 }],
        food: { x: 2, y: 2 },
        score: 5,
        gridSize: 10,
        updatedAt: 1700000000000
      }
    ];
    fetchMock.mockResolvedValue(jsonResponse(snapshots));

    const result = await apiClient.fetchSpectatorSnapshots();

    expect(result).toEqual(snapshots);
  });
});
