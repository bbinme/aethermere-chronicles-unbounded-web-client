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

test('shows −1 modifier for default 8 scores', () => {
  render(<Wrapper />);
  for (const key of [
    'strength',
    'dexterity',
    'constitution',
    'intelligence',
    'wisdom',
    'charisma',
  ] as const) {
    expect(screen.getByTestId(`mod-${key}`)).toHaveTextContent('−1');
  }
});

test('modifier updates when score is incremented', async () => {
  const user = userEvent.setup();
  render(<Wrapper />);
  const incBtn = screen.getByLabelText('Increase STR');
  // 8 → 9 still −1
  await user.click(incBtn);
  expect(screen.getByTestId('mod-strength')).toHaveTextContent('−1');
  // 9 → 10 flips to +0
  await user.click(incBtn);
  expect(screen.getByTestId('mod-strength')).toHaveTextContent('+0');
  // 10 → 11 still +0
  await user.click(incBtn);
  expect(screen.getByTestId('mod-strength')).toHaveTextContent('+0');
  // 11 → 12 flips to +1
  await user.click(incBtn);
  expect(screen.getByTestId('mod-strength')).toHaveTextContent('+1');
});

test('selecting +2 on an ability disables +1 on the same ability', async () => {
  const user = userEvent.setup();
  render(<Wrapper />);
  await user.click(screen.getByLabelText('+2 bonus to STR'));
  expect(screen.getByLabelText('+1 bonus to STR')).toBeDisabled();
  // Other abilities' +1 radios remain enabled.
  expect(screen.getByLabelText('+1 bonus to DEX')).not.toBeDisabled();
});

test('selecting +1 on an ability disables +2 on the same ability', async () => {
  const user = userEvent.setup();
  render(<Wrapper />);
  await user.click(screen.getByLabelText('+1 bonus to STR'));
  expect(screen.getByLabelText('+2 bonus to STR')).toBeDisabled();
  expect(screen.getByLabelText('+2 bonus to DEX')).not.toBeDisabled();
});

test('clicking a checked +2 checkbox unchecks it', async () => {
  const user = userEvent.setup();
  render(<Wrapper />);
  const strPlus2 = screen.getByLabelText('+2 bonus to STR');
  await user.click(strPlus2);
  expect(strPlus2).toBeChecked();
  await user.click(strPlus2);
  expect(strPlus2).not.toBeChecked();
  // After unchecking, the +1 cross-disable should also clear, so +1 STR is enabled.
  expect(screen.getByLabelText('+1 bonus to STR')).not.toBeDisabled();
});

test('selecting +2 on a different ability moves the check off the previous one', async () => {
  const user = userEvent.setup();
  render(<Wrapper />);
  await user.click(screen.getByLabelText('+2 bonus to STR'));
  await user.click(screen.getByLabelText('+2 bonus to DEX'));
  expect(screen.getByLabelText('+2 bonus to STR')).not.toBeChecked();
  expect(screen.getByLabelText('+2 bonus to DEX')).toBeChecked();
});

test('modifier reflects +2 bonus assignment', async () => {
  const user = userEvent.setup();
  render(<Wrapper />);
  // Bring STR up to 14 (8+1+1+1+1+1+2 marginal: 8→14 = 6 clicks, costs 7).
  const incBtn = screen.getByLabelText('Increase STR');
  for (let i = 0; i < 6; i += 1) await user.click(incBtn);
  expect(screen.getByTestId('score-strength')).toHaveTextContent('14');
  expect(screen.getByTestId('mod-strength')).toHaveTextContent('+2');
  // Apply +2 bonus to STR → total 16 → modifier +3.
  await user.click(screen.getByLabelText('+2 bonus to STR'));
  expect(screen.getByTestId('mod-strength')).toHaveTextContent('+3');
});
