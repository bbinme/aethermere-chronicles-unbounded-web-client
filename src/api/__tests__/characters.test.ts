import { http, HttpResponse } from 'msw';
import { beforeEach, expect, test } from 'vitest';
import { server } from '@/test/msw/server';
import { configureApiClient } from '../client';
import { createCharacter, listCharacters, uploadPortrait } from '../characters';

beforeEach(() => {
  configureApiClient({ getToken: () => 'tok', setToken: () => {} });
});

function fullCharacterMock(id: string, name: string) {
  return {
    id,
    playerId: 'player-1',
    name,
    ruleset: 'core',
    characterClass: 'Fighter',
    subclass: null,
    level: 1,
    background: null,
    alignment: null,
    lineage: { key: 'HUMAN', name: 'Human' },
    heritage: { key: 'LOWLANDER', name: 'Lowlander' },
    culture: { key: 'HIGHBORN', name: 'Highborn' },
    abilityScores: {
      strength:     { score: 10, modifier: '+0', pointBuyBonus: '+0' },
      dexterity:    { score: 10, modifier: '+0', pointBuyBonus: '+0' },
      constitution: { score: 10, modifier: '+0', pointBuyBonus: '+0' },
      intelligence: { score: 10, modifier: '+0', pointBuyBonus: '+0' },
      wisdom:       { score: 10, modifier: '+0', pointBuyBonus: '+0' },
      charisma:     { score: 10, modifier: '+0', pointBuyBonus: '+0' },
    },
  };
}

test('listCharacters encodes playerId and returns array', async () => {
  server.use(
    http.get('http://localhost:8080/api/characters', ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get('playerId')).toBe('player 1');
      return HttpResponse.json([fullCharacterMock('c1', 'Aric')]);
    }),
  );
  const res = await listCharacters('player 1');
  expect(res).toHaveLength(1);
  expect(res[0].name).toBe('Aric');
});

test('createCharacter posts to /api/player-characters', async () => {
  let body: unknown = null;
  server.use(
    http.post('http://localhost:8080/api/player-characters', async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(fullCharacterMock('c1', 'Aric'));
    }),
  );
  const res = await createCharacter({
    name: 'Aric',
    ruleset: 'core',
    lineage: 'human',
    heritage: 'lowlander',
    charClass: 'fighter',
    culture: 'highborn',
    gender: 'm',
    abilities: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
  });
  expect(res.id).toBe('c1');
  expect((body as { name: string }).name).toBe('Aric');
});

test('uploadPortrait sends multipart with auth', async () => {
  let auth: string | null = null;
  let isMultipart = false;
  server.use(
    http.post('http://localhost:8080/api/characters/c-1/portrait', ({ request }) => {
      auth = request.headers.get('Authorization');
      isMultipart = (request.headers.get('Content-Type') ?? '').startsWith('multipart/form-data');
      return new HttpResponse(null, { status: 204 });
    }),
  );
  await uploadPortrait('c-1', new Blob([new Uint8Array([1, 2, 3])], { type: 'image/webp' }));
  expect(auth).toBe('Bearer tok');
  expect(isMultipart).toBe(true);
});
