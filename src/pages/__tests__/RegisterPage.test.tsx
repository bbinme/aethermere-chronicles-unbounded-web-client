import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, test } from 'vitest';
import { server } from '@/test/msw/server';
import { AuthProvider } from '@/auth/AuthContext';
import { RegisterPage } from '../RegisterPage';

function setup() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<div>Home</div>} />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

const FAKE_JWT = 'header.' + btoa(JSON.stringify({ sub: 'p' })) + '.sig';

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  values: { username: string; email: string; password: string; confirm: string },
) {
  await user.type(screen.getByLabelText(/username/i), values.username);
  await user.type(screen.getByLabelText(/^email/i), values.email);
  await user.type(screen.getByLabelText(/^password/i), values.password);
  await user.type(screen.getByLabelText(/confirm password/i), values.confirm);
}

test('registers, auto-logs in, navigates home', async () => {
  let registerBody: unknown = null;
  let loginBody: unknown = null;
  server.use(
    http.post('http://localhost:8080/api/auth/register', async ({ request }) => {
      registerBody = await request.json();
      return new HttpResponse(null, { status: 204 });
    }),
    http.post('http://localhost:8080/api/auth/login', async ({ request }) => {
      loginBody = await request.json();
      return HttpResponse.json({ accessToken: FAKE_JWT });
    }),
  );
  const user = userEvent.setup();
  setup();
  await fillForm(user, { username: 'alice', email: 'alice@example.com', password: 'pw1', confirm: 'pw1' });
  await user.click(screen.getByRole('button', { name: /create account/i }));
  expect(await screen.findByText('Home')).toBeInTheDocument();
  expect(registerBody).toEqual({ username: 'alice', email: 'alice@example.com', password: 'pw1' });
  expect(loginBody).toEqual({ username: 'alice', password: 'pw1' });
});

test('shows username taken on 409', async () => {
  server.use(
    http.post(
      'http://localhost:8080/api/auth/register',
      () => new HttpResponse(null, { status: 409 }),
    ),
  );
  const user = userEvent.setup();
  setup();
  await fillForm(user, { username: 'alice', email: 'alice@example.com', password: 'pw1', confirm: 'pw1' });
  await user.click(screen.getByRole('button', { name: /create account/i }));
  expect(await screen.findByText(/username already taken/i)).toBeInTheDocument();
});

test('shows mismatched passwords inline without API call', async () => {
  let calls = 0;
  server.use(
    http.post('http://localhost:8080/api/auth/register', () => {
      calls += 1;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const user = userEvent.setup();
  setup();
  await fillForm(user, { username: 'alice', email: 'alice@example.com', password: 'pw1', confirm: 'pw2' });
  await user.click(screen.getByRole('button', { name: /create account/i }));
  expect(await screen.findByText(/passwords must match/i)).toBeInTheDocument();
  expect(calls).toBe(0);
});

test('shows invalid email inline without API call', async () => {
  let calls = 0;
  server.use(
    http.post('http://localhost:8080/api/auth/register', () => {
      calls += 1;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const user = userEvent.setup();
  setup();
  await fillForm(user, {
    username: 'alice',
    email: 'not-an-email',
    password: 'pw1',
    confirm: 'pw1',
  });
  await user.click(screen.getByRole('button', { name: /create account/i }));
  expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  expect(calls).toBe(0);
});
