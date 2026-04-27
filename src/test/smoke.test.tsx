import { render, screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import App from '../App';

test('renders Aethermere heading', () => {
  render(<App />);
  expect(screen.getByText('Aethermere')).toBeInTheDocument();
});
