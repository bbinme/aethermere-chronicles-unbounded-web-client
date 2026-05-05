import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FormProvider,
  useForm,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { test, expect } from 'vitest';
import { server } from '@/test/msw/server';
import { wizardSchema, type WizardValues } from '../schema';
import { LineageStep } from '../LineageStep';

function Probe() {
  const lineage = useWatch<WizardValues, 'lineage'>({ name: 'lineage' });
  const heritage = useWatch<WizardValues, 'heritage'>({ name: 'heritage' });
  const { errors } = useFormState<WizardValues>();
  return (
    <div data-testid="probe">
      <span data-testid="probe-values">{`${lineage}|${heritage}`}</span>
      <span data-testid="probe-heritage-error">
        {errors.heritage?.message ?? ''}
      </span>
    </div>
  );
}

function TriggerLineageButton() {
  const { trigger } = useFormContext<WizardValues>();
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await trigger(['lineage', 'heritage']);
        const el = document.querySelector('[data-testid="probe-trigger"]');
        if (el) el.textContent = ok ? 'pass' : 'fail';
      }}
    >
      run-trigger
    </button>
  );
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
          strength: 8,
          dexterity: 8,
          constitution: 8,
          intelligence: 8,
          wisdom: 8,
          charisma: 8,
        },
      },
    });
    return (
      <QueryClientProvider client={qc}>
        <FormProvider {...methods}>
          <form>
            <LineageStep />
            <Probe />
            <TriggerLineageButton />
            <span data-testid="probe-trigger" />
          </form>
        </FormProvider>
      </QueryClientProvider>
    );
  }
  return render(<Wrapper />);
}

const LINEAGES_WITH_HERITAGE_LESS = {
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
};

test('lists lineages and binds selection to the form', async () => {
  server.use(
    http.get('http://localhost:8080/api/rulesets/DND/lineages', () =>
      HttpResponse.json(LINEAGES_WITH_HERITAGE_LESS),
    ),
  );
  const user = userEvent.setup();
  setup();
  expect(await screen.findByText('Human')).toBeInTheDocument();
  await user.click(screen.getByText('Human'));
  // After selecting Human, the default heritage (Lowlander) should be auto-set.
  expect(await screen.findByTestId('probe-values')).toHaveTextContent(
    'human|lowlander',
  );
});

test('hides heritage section when chosen lineage has no heritages', async () => {
  server.use(
    http.get('http://localhost:8080/api/rulesets/DND/lineages', () =>
      HttpResponse.json(LINEAGES_WITH_HERITAGE_LESS),
    ),
  );
  const user = userEvent.setup();
  setup();
  await user.click(await screen.findByText('Elf'));
  // Heritage value should be empty after selecting a heritage-less lineage.
  expect(await screen.findByTestId('probe-values')).toHaveTextContent('elf|');
  // The Heritage heading should not be rendered.
  expect(screen.queryByRole('heading', { name: /heritage/i })).toBeNull();
});

test('allows advancing when heritage-less lineage is selected', async () => {
  server.use(
    http.get('http://localhost:8080/api/rulesets/DND/lineages', () =>
      HttpResponse.json(LINEAGES_WITH_HERITAGE_LESS),
    ),
  );
  const user = userEvent.setup();
  setup();
  await user.click(await screen.findByText('Elf'));
  await user.click(screen.getByRole('button', { name: 'run-trigger' }));
  // No heritage error and trigger should pass — wizard would advance.
  expect(await screen.findByTestId('probe-trigger')).toHaveTextContent('pass');
  expect(screen.getByTestId('probe-heritage-error')).toHaveTextContent('');
});

test('allows advancing when lineage with heritages is selected (auto-default)', async () => {
  server.use(
    http.get('http://localhost:8080/api/rulesets/DND/lineages', () =>
      HttpResponse.json(LINEAGES_WITH_HERITAGE_LESS),
    ),
  );
  const user = userEvent.setup();
  setup();
  await user.click(await screen.findByText('Human'));
  await user.click(screen.getByRole('button', { name: 'run-trigger' }));
  expect(await screen.findByTestId('probe-trigger')).toHaveTextContent('pass');
  expect(screen.getByTestId('probe-heritage-error')).toHaveTextContent('');
});

test('switching from heritage-less to heritage-having lineage clears any prior heritage state', async () => {
  server.use(
    http.get('http://localhost:8080/api/rulesets/DND/lineages', () =>
      HttpResponse.json(LINEAGES_WITH_HERITAGE_LESS),
    ),
  );
  const user = userEvent.setup();
  setup();
  // Pick Elf (no heritages), then Human (has heritages — default Lowlander).
  await user.click(await screen.findByText('Elf'));
  expect(await screen.findByTestId('probe-values')).toHaveTextContent('elf|');
  await user.click(screen.getByText('Human'));
  expect(await screen.findByTestId('probe-values')).toHaveTextContent(
    'human|lowlander',
  );
  // Heritage section should now be visible.
  expect(
    screen.getByRole('heading', { name: /heritage/i }),
  ).toBeInTheDocument();
});
