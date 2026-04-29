import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, test, expect, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { AuthProvider } from '@/auth/AuthContext';
import { CharacterCreatePage } from '../../CharacterCreatePage';

beforeEach(() => {
  // jsdom polyfills (not strictly required since these tests don't upload portraits,
  // but harmless and keeps PortraitStep render safe).
  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

function setupRulesetHandlers() {
  server.use(
    http.get('http://localhost:8080/api/rulesets/DND/lineages', () =>
      HttpResponse.json({
        term: 'Lineage',
        lineages: [
          {
            key: 'human',
            displayName: 'Human',
            description: '',
            heritages: [
              {
                key: 'lowlander',
                displayName: 'Lowlander',
                description: '',
                isDefault: true,
              },
            ],
          },
        ],
      }),
    ),
    http.get('http://localhost:8080/api/rulesets/DND/classes', () =>
      HttpResponse.json({
        term: 'Class',
        classes: [{ key: 'fighter', displayName: 'Fighter', description: '' }],
      }),
    ),
    http.get('http://localhost:8080/api/rulesets/DND/cultures', () =>
      HttpResponse.json({
        term: 'Culture',
        cultures: [
          { key: 'highborn', displayName: 'Highborn', description: '' },
        ],
      }),
    ),
  );
}

function renderWizard() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/characters/new']}>
          <Routes>
            <Route
              path="/characters/new"
              element={<CharacterCreatePage />}
            />
            <Route path="/" element={<div>Home</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

async function fillWizardThroughReview(
  user: ReturnType<typeof userEvent.setup>,
) {
  // Step 0: Identity
  await user.type(screen.getByLabelText(/^name/i), 'Aric');
  await user.selectOptions(screen.getByLabelText(/gender/i), 'MALE');
  await user.click(screen.getByRole('button', { name: /^next$/i }));

  // Step 1: Lineage — click Human (auto-selects Lowlander heritage)
  await user.click(await screen.findByText('Human'));
  await user.click(screen.getByRole('button', { name: /^next$/i }));

  // Step 2: Class
  await user.click(await screen.findByText('Fighter'));
  await user.click(screen.getByRole('button', { name: /^next$/i }));

  // Step 3: Culture
  await user.click(await screen.findByText('Highborn'));
  await user.click(screen.getByRole('button', { name: /^next$/i }));

  // Step 4: Stats — pick the required +2 and +1 bonuses (must be different)
  await user.click(screen.getByLabelText(/\+2 bonus to STR/i));
  await user.click(screen.getByLabelText(/\+1 bonus to DEX/i));
  await user.click(screen.getByRole('button', { name: /^next$/i }));

  // Step 5: Portrait — skip
  await user.click(screen.getByRole('button', { name: /^next$/i }));
}

test('happy path: creates character and navigates home', async () => {
  setupRulesetHandlers();
  let createBody: unknown = null;
  server.use(
    http.post(
      'http://localhost:8080/api/player-characters',
      async ({ request }) => {
        createBody = await request.json();
        return HttpResponse.json({
          id: 'c-1',
          name: 'Aric',
          ruleset: 'DND',
          charClass: 'fighter',
          lineage: 'human',
          heritage: 'lowlander',
          culture: 'highborn',
          level: 1,
          abilities: {
            strength: 8,
            dexterity: 8,
            constitution: 8,
            intelligence: 8,
            wisdom: 8,
            charisma: 8,
          },
        });
      },
    ),
  );
  const user = userEvent.setup();
  renderWizard();
  await fillWizardThroughReview(user);
  await user.click(
    screen.getByRole('button', { name: /create character/i }),
  );
  expect(await screen.findByText('Home')).toBeInTheDocument();
  // Verify the request body had the right shape
  expect(createBody).toMatchObject({
    name: 'Aric',
    ruleset: 'DND',
    lineage: 'human',
    heritage: 'lowlander',
    charClass: 'fighter',
    culture: 'highborn',
    gender: 'MALE',
    abilities: {
      strength: 10, // 8 base + 2 bonus
      dexterity: 9, // 8 base + 1 bonus
      constitution: 8,
      intelligence: 8,
      wisdom: 8,
      charisma: 8,
    },
  });
});

test('field error from server: jumps back to errored step', async () => {
  setupRulesetHandlers();
  server.use(
    http.post('http://localhost:8080/api/player-characters', () =>
      HttpResponse.json(
        {
          code: 'VALIDATION',
          message: 'invalid',
          fieldErrors: { name: 'Already taken' },
        },
        { status: 400 },
      ),
    ),
  );
  const user = userEvent.setup();
  renderWizard();
  await fillWizardThroughReview(user);
  await user.click(
    screen.getByRole('button', { name: /create character/i }),
  );
  // After error, wizard jumps back to step 0 (Identity, where 'name' lives)
  expect(await screen.findByText(/already taken/i)).toBeInTheDocument();
  // Should be on Identity step now — name input visible with the typed value
  const nameInput = screen.getByLabelText(/^name/i) as HTMLInputElement;
  expect(nameInput).toBeInTheDocument();
  expect(nameInput.value).toBe('Aric');
  // The Next button is back (not Create Character) because we're on step 0
  expect(
    screen.getByRole('button', { name: /^next$/i }),
  ).toBeInTheDocument();
});

test('5xx: stays on review with generic error', async () => {
  setupRulesetHandlers();
  server.use(
    http.post(
      'http://localhost:8080/api/player-characters',
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  const user = userEvent.setup();
  renderWizard();
  await fillWizardThroughReview(user);
  await user.click(
    screen.getByRole('button', { name: /create character/i }),
  );
  expect(
    await screen.findByText(/something went wrong/i),
  ).toBeInTheDocument();
  // Still on Review step — the Create Character button is still present
  expect(
    screen.getByRole('button', { name: /create character/i }),
  ).toBeInTheDocument();
});
