import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { test, expect } from 'vitest';
import { server } from '@/test/msw/server';
import { AuthProvider } from '../AuthContext';
import { ProtectedRoute } from '../ProtectedRoute';

function setup(initial: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/login" element={<div>Login</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

test('redirects to /login when refresh fails', async () => {
  server.use(
    http.post(
      'http://localhost:8080/api/auth/refresh',
      () => new HttpResponse(null, { status: 401 }),
    ),
  );
  setup('/');
  expect(await screen.findByText('Login')).toBeInTheDocument();
});

test('renders home when refresh succeeds', async () => {
  // Hand-crafted JWT with sub claim 'p' so AuthContext can decode it without errors
  const fakeJwt = 'header.' + btoa(JSON.stringify({ sub: 'p' })) + '.sig';
  server.use(
    http.post('http://localhost:8080/api/auth/refresh', () =>
      HttpResponse.json({ accessToken: fakeJwt }),
    ),
  );
  setup('/');
  expect(await screen.findByText('Home')).toBeInTheDocument();
});
