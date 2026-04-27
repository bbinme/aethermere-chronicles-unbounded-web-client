import { beforeEach, describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { apiFetch, configureApiClient } from '../client';
import { ApiError } from '../errors';

const BASE = 'http://localhost:8080';

describe('apiFetch', () => {
  let token: string | null = null;

  beforeEach(() => {
    token = null;
    configureApiClient({
      getToken: () => token,
      setToken: (t) => {
        token = t;
      },
    });
  });

  test('adds Authorization header when token is set', async () => {
    token = 'tok-1';
    let observedAuth: string | null = null;
    server.use(
      http.get(`${BASE}/api/ping`, ({ request }) => {
        observedAuth = request.headers.get('authorization');
        return HttpResponse.json({ ok: true });
      }),
    );
    await apiFetch<{ ok: boolean }>('/api/ping');
    expect(observedAuth).toBe('Bearer tok-1');
  });

  test('always sends credentials include', async () => {
    let observedCredentials: RequestCredentials | undefined;
    server.use(
      http.get(`${BASE}/api/ping`, ({ request }) => {
        observedCredentials = request.credentials;
        return HttpResponse.json({ ok: true });
      }),
    );
    await apiFetch<{ ok: boolean }>('/api/ping');
    expect(observedCredentials).toBe('include');
  });

  test('refreshes on 401 and retries original request', async () => {
    token = 'expired';
    let refreshCalls = 0;
    let pingCalls = 0;
    let pingCallsAfterRefresh = 0;
    let refreshDone = false;

    server.use(
      http.post(`${BASE}/api/auth/refresh`, () => {
        refreshCalls += 1;
        refreshDone = true;
        return HttpResponse.json({ accessToken: 'fresh-tok' });
      }),
      http.get(`${BASE}/api/ping`, ({ request }) => {
        pingCalls += 1;
        if (!refreshDone) {
          return new HttpResponse(null, { status: 401 });
        }
        pingCallsAfterRefresh += 1;
        const auth = request.headers.get('authorization');
        return HttpResponse.json({ ok: true, auth });
      }),
    );

    const result = await apiFetch<{ ok: boolean; auth: string }>('/api/ping');
    expect(refreshCalls).toBe(1);
    expect(pingCalls).toBe(2);
    expect(pingCallsAfterRefresh).toBe(1);
    expect(result.ok).toBe(true);
    expect(result.auth).toBe('Bearer fresh-tok');
    expect(token).toBe('fresh-tok');
  });

  test('concurrent 401s share one refresh', async () => {
    token = 'expired';
    let refreshCalls = 0;
    let refreshCompleted = false;
    let pingCallsAfterRefresh = 0;

    server.use(
      http.post(`${BASE}/api/auth/refresh`, async () => {
        refreshCalls += 1;
        await new Promise((r) => setTimeout(r, 10));
        refreshCompleted = true;
        return HttpResponse.json({ accessToken: 'new-tok' });
      }),
      http.get(`${BASE}/api/ping`, () => {
        if (!refreshCompleted) return new HttpResponse(null, { status: 401 });
        pingCallsAfterRefresh += 1;
        return HttpResponse.json({ ok: true });
      }),
    );

    const results = await Promise.all([
      apiFetch<{ ok: true }>('/api/ping'),
      apiFetch<{ ok: true }>('/api/ping'),
      apiFetch<{ ok: true }>('/api/ping'),
    ]);
    expect(refreshCalls).toBe(1);
    expect(pingCallsAfterRefresh).toBe(3);
    expect(results.every((r) => r.ok)).toBe(true);
  });

  test('fires auth-expired and throws when refresh fails', async () => {
    token = 'expired';
    let authExpiredFired = false;
    const handler = () => {
      authExpiredFired = true;
    };
    window.addEventListener('auth-expired', handler);

    try {
      server.use(
        http.post(`${BASE}/api/auth/refresh`, () => {
          return new HttpResponse(null, { status: 401 });
        }),
        http.get(`${BASE}/api/ping`, () => {
          return new HttpResponse(null, { status: 401 });
        }),
      );

      await expect(apiFetch<{ ok: true }>('/api/ping')).rejects.toBeInstanceOf(ApiError);
      expect(authExpiredFired).toBe(true);
    } finally {
      window.removeEventListener('auth-expired', handler);
    }
  });

  test('throws ApiError with fieldErrors on 4xx', async () => {
    server.use(
      http.post(`${BASE}/api/things`, () => {
        return HttpResponse.json(
          {
            code: 'VALIDATION_FAILED',
            message: 'Validation failed',
            fieldErrors: { name: 'Name is required' },
          },
          { status: 400 },
        );
      }),
    );

    let caught: unknown;
    try {
      await apiFetch<{ ok: true }>('/api/things', {
        method: 'POST',
        body: { name: '' },
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ApiError);
    const err = caught as ApiError;
    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_FAILED');
    expect(err.message).toBe('Validation failed');
    expect(err.fieldErrors).toEqual({ name: 'Name is required' });
  });

  test('does not refresh when noRefresh is true', async () => {
    token = 'expired';
    let refreshCalls = 0;

    server.use(
      http.post(`${BASE}/api/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({ accessToken: 'fresh' });
      }),
      http.get(`${BASE}/api/ping`, () => {
        return new HttpResponse(null, { status: 401 });
      }),
    );

    await expect(
      apiFetch<{ ok: true }>('/api/ping', { noRefresh: true }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(refreshCalls).toBe(0);
  });

  test('returns undefined on 204', async () => {
    server.use(
      http.delete(`${BASE}/api/things/1`, () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const result = await apiFetch<void>('/api/things/1', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });
});
