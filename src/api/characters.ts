import { apiFetch } from './client';
import type { CharacterCreateRequest, CharacterResponse } from './types';

const BASE_URL = import.meta.env.VITE_GMS_URL ?? 'http://localhost:8080';

export const listCharacters = (playerId: string) =>
  apiFetch<CharacterResponse[]>(`/api/characters?playerId=${encodeURIComponent(playerId)}`);

export const getCharacter = (characterId: string) =>
  apiFetch<CharacterResponse>(`/api/characters/${encodeURIComponent(characterId)}`);

export const createCharacter = (req: CharacterCreateRequest) =>
  apiFetch<CharacterResponse>('/api/player-characters', { method: 'POST', body: req });

export const renameCharacter = (characterId: string, name: string) =>
  apiFetch<CharacterResponse>(`/api/player-characters/${encodeURIComponent(characterId)}`, {
    method: 'PATCH',
    body: { name },
  });

export const uploadPortrait = (characterId: string, file: Blob) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiFetch<void>(`/api/characters/${encodeURIComponent(characterId)}/portrait`, {
    method: 'POST',
    body: fd,
  });
};

/**
 * Fetches the portrait as a Blob, returns null on 404.
 * Bypasses apiFetch because we need the raw Blob, not JSON parsing.
 * Uses bearer auth via the token argument.
 */
export async function fetchPortraitBlob(
  characterId: string,
  token: string | null,
): Promise<Blob | null> {
  const res = await fetch(
    `${BASE_URL}/api/characters/${encodeURIComponent(characterId)}/portrait`,
    {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Portrait fetch failed: ${res.status}`);
  return res.blob();
}
