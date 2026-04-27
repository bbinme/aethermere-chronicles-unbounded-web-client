import { createContext } from 'react';

export interface AuthState {
  accessToken: string | null;
  playerId: string | null;
  setAccessToken: (token: string | null) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);
