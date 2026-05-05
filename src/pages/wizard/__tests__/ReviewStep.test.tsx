import { http, HttpResponse } from 'msw';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { test, expect } from 'vitest';
import { server } from '@/test/msw/server';
import { wizardSchema, type WizardValues } from '../schema';
import { ReviewStep } from '../ReviewStep';

function setup(values: Partial<WizardValues>) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper() {
    const methods = useForm<WizardValues>({
      resolver: zodResolver(wizardSchema),
      defaultValues: {
        name: 'Aric',
        gender: 'MALE',
        pronouns: 'he/him',
        bio: '',
        lineage: 'human',
        heritage: 'lowlander',
        charClass: 'fighter',
        culture: 'highborn',
        abilities: {
          strength: 14,
          dexterity: 12,
          constitution: 13,
          intelligence: 10,
          wisdom: 11,
          charisma: 9,
        },
        ...values,
      } as WizardValues,
    });
    return (
      <QueryClientProvider client={qc}>
        <FormProvider {...methods}>
          <form>
            <ReviewStep />
          </form>
        </FormProvider>
      </QueryClientProvider>
    );
  }
  return render(<Wrapper />);
}

test('renders all wizard values with display names looked up', async () => {
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
        classes: [
          { key: 'fighter', displayName: 'Fighter', description: '', hitDie: 10 },
        ],
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
  setup({});
  expect(await screen.findByText('Human')).toBeInTheDocument();
  expect(await screen.findByText('Lowlander')).toBeInTheDocument();
  expect(await screen.findByText('Fighter')).toBeInTheDocument();
  expect(await screen.findByText('Highborn')).toBeInTheDocument();
  expect(screen.getByText('Aric')).toBeInTheDocument();
  expect(screen.getByText('Male')).toBeInTheDocument();
  expect(screen.getByText('he/him')).toBeInTheDocument();
  // No portrait selected
  expect(screen.getByText('None')).toBeInTheDocument();
  // STR = 14
  expect(screen.getByText('14')).toBeInTheDocument();
  // 1st-level HP: Fighter d10 + Con mod (CON 13 → +1) = 11.
  // Scope to the HP row so we don't collide with WIS = 11 in the abilities grid.
  const hpLabel = await screen.findByText(/hit points/i);
  const hpRow = hpLabel.parentElement!;
  expect(within(hpRow).getByText('11')).toBeInTheDocument();
});

test('omits HP line when class has no hitDie', async () => {
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
        // hitDie omitted — simulates GMS pre-rollout
        classes: [{ key: 'fighter', displayName: 'Fighter', description: '' }],
      }),
    ),
    http.get('http://localhost:8080/api/rulesets/DND/cultures', () =>
      HttpResponse.json({
        term: 'Culture',
        cultures: [{ key: 'highborn', displayName: 'Highborn', description: '' }],
      }),
    ),
  );
  setup({});
  expect(await screen.findByText('Fighter')).toBeInTheDocument();
  expect(screen.queryByText(/hit points/i)).toBeNull();
});
