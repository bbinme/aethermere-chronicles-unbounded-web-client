import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { AuthProvider } from '@/auth/AuthContext';
import { useAuth } from '@/auth/useAuth';
import { CharacterListPage } from '../CharacterListPage';

beforeEach(() => {
  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  }
});

const FAKE_JWT = 'header.' + btoa(JSON.stringify({ sub: 'player-1' })) + '.sig';

function TokenSetter() {
  const { setAccessToken, accessToken } = useAuth();
  if (!accessToken) setAccessToken(FAKE_JWT);
  return null;
}

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <TokenSetter />
        <MemoryRouter>
          <CharacterListPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

test('shows empty state when no characters', async () => {
  server.use(
    http.get('http://localhost:8080/api/characters', () => HttpResponse.json([])),
    http.get('http://localhost:8080/api/characters/:id/portrait', () => new HttpResponse(null, { status: 404 })),
  );
  setup();
  expect(await screen.findByText(/haven.*created any characters/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /create new character/i })).toBeInTheDocument();
});

test('renders a character card', async () => {
  server.use(
    http.get('http://localhost:8080/api/characters', () =>
      HttpResponse.json([fullCharacter('c-1', 'Aric', 3)]),
    ),
    http.get('http://localhost:8080/api/characters/c-1/portrait', () => new HttpResponse(null, { status: 404 })),
  );
  setup();
  expect(await screen.findByText('Aric')).toBeInTheDocument();
  expect(screen.getByText(/level 3/i)).toBeInTheDocument();
  expect(screen.getByText(/Human Fighter/i)).toBeInTheDocument();
});

function fullCharacter(id: string, name: string, level: number) {
  return {
    id,
    playerId: 'player-1',
    name,
    ruleset: 'DND',
    characterClass: 'Fighter',
    subclass: null,
    level,
    background: null,
    alignment: null,
    lineage: { key: 'HUMAN', name: 'Human' },
    heritage: { key: 'LOWLANDER', name: 'Lowlander' },
    culture: { key: 'HIGHBORN', name: 'Highborn' },
    abilityScores: {
      strength:     { score: 14, modifier: '+2', pointBuyBonus: '+0' },
      dexterity:    { score: 12, modifier: '+1', pointBuyBonus: '+0' },
      constitution: { score: 13, modifier: '+1', pointBuyBonus: '+0' },
      intelligence: { score: 10, modifier: '+0', pointBuyBonus: '+0' },
      wisdom:       { score: 11, modifier: '+0', pointBuyBonus: '+0' },
      charisma:     { score: 9,  modifier: '-1', pointBuyBonus: '+0' },
    },
  };
}
