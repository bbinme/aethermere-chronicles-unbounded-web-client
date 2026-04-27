import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { test, expect } from 'vitest';
import { AuthProvider } from '@/auth/AuthContext';
import { server } from './msw/server';
import App from '../App';

test('redirects unauthenticated user to /login', async () => {
  server.use(
    http.post(
      'http://localhost:8080/api/auth/refresh',
      () => new HttpResponse(null, { status: 401 }),
    ),
  );
  render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
  expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
});
