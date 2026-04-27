import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { configureApiClient } from '@/api/client';
import { AuthContext, type AuthState } from './authContextValue';

function decodePlayerId(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      sub?: unknown;
    };
    return typeof json.sub === 'string' ? json.sub : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = accessToken;

  const setAccessToken = useCallback((token: string | null) => {
    setAccessTokenState(token);
  }, []);

  // Wire apiFetch on mount.
  useEffect(() => {
    configureApiClient({
      getToken: () => tokenRef.current,
      setToken: (t) => setAccessTokenState(t),
    });
  }, []);

  // Listen for auth-expired (fired by apiFetch when refresh fails).
  useEffect(() => {
    const handler = () => setAccessTokenState(null);
    window.addEventListener('auth-expired', handler);
    return () => window.removeEventListener('auth-expired', handler);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      accessToken,
      playerId: decodePlayerId(accessToken),
      setAccessToken,
    }),
    [accessToken, setAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
