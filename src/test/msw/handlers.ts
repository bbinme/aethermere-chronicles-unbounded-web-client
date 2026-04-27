import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('http://localhost:8080/api/health', () => HttpResponse.json({ ok: true })),
];
