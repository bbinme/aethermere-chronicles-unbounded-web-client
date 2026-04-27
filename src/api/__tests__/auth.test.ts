import { http, HttpResponse } from 'msw';
import { beforeEach, expect, test } from 'vitest';
import { server } from '@/test/msw/server';
import { configureApiClient } from '../client';
import { login, register } from '../auth';

beforeEach(() => {
  configureApiClient({ getToken: () => null, setToken: () => {} });
});

test('login posts credentials and returns access token', async () => {
  let body: unknown = null;
  server.use(
    http.post('http://localhost:8080/api/auth/login', async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ accessToken: 'tok' });
    }),
  );
  const res = await login({ username: 'a', password: 'b' });
  expect(body).toEqual({ username: 'a', password: 'b' });
  expect(res.accessToken).toBe('tok');
});

test('register posts username, email, password', async () => {
  let body: unknown = null;
  server.use(
    http.post('http://localhost:8080/api/auth/register', async ({ request }) => {
      body = await request.json();
      // GMS returns 200 with no body for register; use 204 here so apiFetch
      // skips JSON parsing (it short-circuits void responses on 204).
      return new HttpResponse(null, { status: 204 });
    }),
  );
  await register({ username: 'a', email: 'a@b.c', password: 'b' });
  expect(body).toEqual({ username: 'a', email: 'a@b.c', password: 'b' });
});
