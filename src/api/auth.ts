import { apiFetch } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest } from './types';

export const login = (req: LoginRequest) =>
  apiFetch<AuthResponse>('/api/auth/login', { method: 'POST', body: req, noRefresh: true });

export const register = (req: RegisterRequest) =>
  apiFetch<void>('/api/auth/register', { method: 'POST', body: req, noRefresh: true });

export const logout = () => apiFetch<void>('/api/auth/logout', { method: 'POST' });

export const refresh = () =>
  apiFetch<AuthResponse>('/api/auth/refresh', { method: 'POST', noRefresh: true });
