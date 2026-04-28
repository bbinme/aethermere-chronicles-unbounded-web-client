import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { test, expect } from 'vitest';
import { wizardSchema, type WizardValues } from '../schema';
import { IdentityStep } from '../IdentityStep';

function Wrapper() {
  const methods = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    mode: 'onChange',
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
    <FormProvider {...methods}>
      <form>
        <IdentityStep />
      </form>
    </FormProvider>
  );
}

test('shows error when name is cleared after typing', async () => {
  const user = userEvent.setup();
  render(<Wrapper />);
  const name = screen.getByLabelText(/^name/i);
  await user.type(name, 'x');
  await user.clear(name);
  expect(await screen.findByText(/required/i)).toBeInTheDocument();
});

test('rejects name over 40 chars', async () => {
  const user = userEvent.setup();
  render(<Wrapper />);
  const name = screen.getByLabelText(/^name/i);
  await user.type(name, 'a'.repeat(41));
  expect(await screen.findByText(/max 40 chars/i)).toBeInTheDocument();
});
