import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, test } from 'vitest';
import { server } from '@/test/msw/server';
import { AuthProvider } from '@/auth/AuthContext';
import { LoginPage } from '../LoginPage';

function setup() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Home</div>} />
          <Route path="/register" element={<div>Register page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

const FAKE_JWT = 'header.' + btoa(JSON.stringify({ sub: 'p' })) + '.sig';

test('logs in and navigates home', async () => {
  server.use(
    http.post('http://localhost:8080/api/auth/login', () =>
      HttpResponse.json({ accessToken: FAKE_JWT }),
    ),
  );
  const user = userEvent.setup();
  setup();
  await user.type(screen.getByLabelText(/username/i), 'alice');
  await user.type(screen.getByLabelText(/password/i), 'secret');
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  expect(await screen.findByText('Home')).toBeInTheDocument();
});

test('shows invalid credentials on 401', async () => {
  server.use(
    http.post(
      'http://localhost:8080/api/auth/login',
      () => new HttpResponse(null, { status: 401 }),
    ),
  );
  const user = userEvent.setup();
  setup();
  await user.type(screen.getByLabelText(/username/i), 'alice');
  await user.type(screen.getByLabelText(/password/i), 'wrong');
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
});

test('blocks submit with empty fields', async () => {
  let calls = 0;
  server.use(
    http.post('http://localhost:8080/api/auth/login', () => {
      calls += 1;
      return HttpResponse.json({ accessToken: FAKE_JWT });
    }),
  );
  const user = userEvent.setup();
  setup();
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  // Both fields required
  expect(await screen.findAllByText(/required/i)).toHaveLength(2);
  expect(calls).toBe(0);
});
