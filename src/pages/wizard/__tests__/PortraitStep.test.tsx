import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { afterEach, beforeEach, test, expect, vi } from 'vitest';
import { wizardSchema, type WizardValues } from '../schema';
import { PortraitStep } from '../PortraitStep';

// jsdom doesn't implement createImageBitmap or canvas.toBlob — stub them so the
// real downscaleToWebP runs cleanly without hitting native APIs.
beforeEach(() => {
  (
    globalThis as unknown as { createImageBitmap: typeof createImageBitmap }
  ).createImageBitmap = vi.fn(
    async () =>
      ({ width: 100, height: 100, close: () => {} }) as unknown as ImageBitmap,
  );
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () =>
      ({
        drawImage: vi.fn(),
      }) as unknown as CanvasRenderingContext2D,
  ) as unknown as HTMLCanvasElement['getContext'];
  HTMLCanvasElement.prototype.toBlob = function (
    cb: BlobCallback,
    type?: string,
  ) {
    cb(new Blob(['stub'], { type: type ?? 'image/webp' }));
  } as HTMLCanvasElement['toBlob'];
  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  }
});

afterEach(() => {
  vi.clearAllMocks();
});

function Probe() {
  const v = useWatch<WizardValues, 'portraitFile'>({ name: 'portraitFile' });
  return <div data-testid="probe">{v ? 'has-blob' : 'empty'}</div>;
}

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
        <PortraitStep />
        <Probe />
      </form>
    </FormProvider>
  );
}

test('rejects non-image content type', async () => {
  const user = userEvent.setup({ applyAccept: false });
  render(<Wrapper />);
  const input = document.getElementById('portrait-input') as HTMLInputElement;
  const file = new File(['x'], 'evil.txt', { type: 'text/plain' });
  await user.upload(input, file);
  expect(
    await screen.findByText(/must be png, jpeg, or webp/i),
  ).toBeInTheDocument();
  expect(screen.getByTestId('probe')).toHaveTextContent('empty');
});

test('rejects files over 4 MB', async () => {
  const user = userEvent.setup();
  render(<Wrapper />);
  const input = document.getElementById('portrait-input') as HTMLInputElement;
  // Create a 5 MB file.
  const big = new File([new Uint8Array(5 * 1024 * 1024)], 'big.png', {
    type: 'image/png',
  });
  await user.upload(input, big);
  expect(await screen.findByText(/max 4 mb/i)).toBeInTheDocument();
  expect(screen.getByTestId('probe')).toHaveTextContent('empty');
});

test('accepts a valid image and stores blob', async () => {
  const user = userEvent.setup();
  render(<Wrapper />);
  const input = document.getElementById('portrait-input') as HTMLInputElement;
  const ok = new File(
    [new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
    'p.png',
    { type: 'image/png' },
  );
  await user.upload(input, ok);
  await waitFor(() =>
    expect(screen.getByTestId('probe')).toHaveTextContent('has-blob'),
  );
});

test('AI generate button is rendered, disabled, with tooltip', () => {
  render(<Wrapper />);
  const btn = screen.getByRole('button', { name: /generate with ai/i });
  expect(btn).toBeDisabled();
  expect(btn).toHaveAttribute('title', 'Coming soon');
});
