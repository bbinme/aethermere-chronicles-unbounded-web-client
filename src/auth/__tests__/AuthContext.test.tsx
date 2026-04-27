import { act, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { AuthProvider } from '../AuthContext';
import { useAuth } from '../useAuth';

const FAKE_JWT =
  'header.' + btoa(JSON.stringify({ sub: 'player-1' })) + '.sig';

function AuthProbe() {
  const { accessToken, playerId, setAccessToken } = useAuth();
  return (
    <div>
      <div data-testid="token">{accessToken ?? 'null'}</div>
      <div data-testid="player">{playerId ?? 'null'}</div>
      <button onClick={() => setAccessToken(FAKE_JWT)}>set</button>
      <button onClick={() => setAccessToken(null)}>clear</button>
    </div>
  );
}

describe('AuthContext', () => {
  test('decodes playerId from JWT sub claim', async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId('token')).toHaveTextContent('null');
    expect(screen.getByTestId('player')).toHaveTextContent('null');

    await act(async () => {
      screen.getByText('set').click();
    });

    expect(screen.getByTestId('token')).toHaveTextContent(FAKE_JWT);
    expect(screen.getByTestId('player')).toHaveTextContent('player-1');
  });

  test('clears token on auth-expired event', async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await act(async () => {
      screen.getByText('set').click();
    });
    expect(screen.getByTestId('token')).toHaveTextContent(FAKE_JWT);

    await act(async () => {
      window.dispatchEvent(new Event('auth-expired'));
    });

    expect(screen.getByTestId('token')).toHaveTextContent('null');
    expect(screen.getByTestId('player')).toHaveTextContent('null');
  });
});
