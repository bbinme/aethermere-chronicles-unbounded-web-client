import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, test, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { AuthProvider } from '@/auth/AuthContext';
import { useAuth } from '@/auth/useAuth';
import { CharacterPortrait } from '../CharacterPortrait';

beforeEach(() => {
  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  }
});

const FAKE_JWT = 'header.' + btoa(JSON.stringify({ sub: 'p' })) + '.sig';

function TokenSetter() {
  const { setAccessToken, accessToken } = useAuth();
  if (!accessToken) setAccessToken(FAKE_JWT);
  return null;
}

function setup(characterId: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <TokenSetter />
        <CharacterPortrait characterId={characterId} alt="Test" />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

test('renders blob image when portrait fetched', async () => {
  server.use(
    http.get('http://localhost:8080/api/characters/c-1/portrait', () =>
      HttpResponse.arrayBuffer(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer, {
        headers: { 'Content-Type': 'image/webp' },
      }),
    ),
  );
  setup('c-1');
  const img = await screen.findByRole('img', { name: 'Test' });
  expect(img).toHaveAttribute('src', expect.stringMatching(/^blob:/));
});

test('renders placeholder on 404', async () => {
  server.use(
    http.get('http://localhost:8080/api/characters/c-2/portrait', () => new HttpResponse(null, { status: 404 })),
  );
  setup('c-2');
  expect(await screen.findByLabelText(/no portrait/i)).toBeInTheDocument();
});
