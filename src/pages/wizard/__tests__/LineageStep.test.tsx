import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { test, expect } from 'vitest';
import { server } from '@/test/msw/server';
import { wizardSchema, type WizardValues } from '../schema';
import { LineageStep } from '../LineageStep';

function Probe() {
  const lineage = useWatch<WizardValues, 'lineage'>({ name: 'lineage' });
  const heritage = useWatch<WizardValues, 'heritage'>({ name: 'heritage' });
  return <div data-testid="probe">{`${lineage}|${heritage}`}</div>;
}

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper() {
    const methods = useForm<WizardValues>({
      resolver: zodResolver(wizardSchema),
      defaultValues: {
        name: '',
        gender: '',
        pronouns: '',
        bio: '',
        lineage: '',
        heritage: '',
        charClass: '',
        culture: '',
        abilities: {
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
          wisdom: 0,
          charisma: 0,
        },
      },
    });
    return (
      <QueryClientProvider client={qc}>
        <FormProvider {...methods}>
          <form>
            <LineageStep />
            <Probe />
          </form>
        </FormProvider>
      </QueryClientProvider>
    );
  }
  return render(<Wrapper />);
}

test('lists lineages and binds selection to the form', async () => {
  server.use(
    http.get('http://localhost:8080/api/rulesets/core/lineages', () =>
      HttpResponse.json({
        term: 'Lineage',
        lineages: [
          {
            key: 'human',
            displayName: 'Human',
            description: 'versatile',
            heritages: [
              {
                key: 'lowlander',
                displayName: 'Lowlander',
                description: 'plains',
                isDefault: true,
              },
              {
                key: 'highlander',
                displayName: 'Highlander',
                description: 'mountains',
                isDefault: false,
              },
            ],
          },
          { key: 'elf', displayName: 'Elf', description: 'wise', heritages: [] },
        ],
      }),
    ),
  );
  const user = userEvent.setup();
  setup();
  expect(await screen.findByText('Human')).toBeInTheDocument();
  await user.click(screen.getByText('Human'));
  // After selecting Human, the default heritage (Lowlander) should be auto-set.
  expect(await screen.findByTestId('probe')).toHaveTextContent('human|lowlander');
});
