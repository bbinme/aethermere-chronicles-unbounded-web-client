import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { test, expect } from 'vitest';
import { wizardSchema, type WizardValues } from '../schema';
import { StatsStep } from '../StatsStep';

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
    <FormProvider {...methods}>
      <form>
        <StatsStep />
      </form>
    </FormProvider>
  );
}

test('starts with all 8s and 27 points remaining', () => {
  render(<Wrapper />);
  expect(screen.getByTestId('score-strength')).toHaveTextContent('8');
  expect(screen.getByText(/points remaining/i)).toHaveTextContent('27');
});

test('decrement disabled at 8', () => {
  render(<Wrapper />);
  const decBtn = screen.getByLabelText('Decrease STR');
  expect(decBtn).toBeDisabled();
});

test('increment increases score and decreases remaining points', async () => {
  const user = userEvent.setup();
  render(<Wrapper />);
  const incBtn = screen.getByLabelText('Increase STR');
  await user.click(incBtn);
  expect(screen.getByTestId('score-strength')).toHaveTextContent('9');
  expect(screen.getByText(/points remaining/i)).toHaveTextContent('26');
});

test('cannot increment STR past 16', async () => {
  const user = userEvent.setup();
  render(<Wrapper />);
  const incBtn = screen.getByLabelText('Increase STR');
  // 8->16 marginal costs: 1+1+1+1+1+1+2+2+3 = wait: 8->9=1, 9->10=1, 10->11=1,
  // 11->12=1, 12->13=1, 13->14=2, 14->15=2, 15->16=3 = 12 total over 8 clicks.
  // After 8 clicks STR is 16, 12 points spent, 15 remaining (capped by score).
  for (let i = 0; i < 8; i += 1) await user.click(incBtn);
  expect(screen.getByTestId('score-strength')).toHaveTextContent('16');
  expect(incBtn).toBeDisabled();
});
