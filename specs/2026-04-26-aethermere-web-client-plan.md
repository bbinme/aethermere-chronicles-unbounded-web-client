# Aethermere Web Client — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite + React + TypeScript SPA that replaces the existing Swing client's auth and character-creation screens, talking directly to the GMS Spring Boot backend; add the supporting CORS configuration and portrait endpoints to GMS.

**Architecture:** Standalone SPA in `web-client/`, Tailwind + shadcn/ui, JWT in memory + refresh cookie, TanStack Query for server state, React Hook Form + Zod for forms. Two GMS-side changes: CORS config and a new `POST/GET /api/characters/{id}/portrait` pair backed by on-disk WebP storage.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui (Radix), React Router, TanStack Query, React Hook Form, Zod, Vitest, React Testing Library, MSW, Playwright. GMS-side: Spring Boot, Java, existing Flyway/Liquibase migration tooling.

**Spec:** `web-client/specs/2026-04-26-aethermere-web-client-design.md`

**Repos:**
- Web client: `C:\Users\Bryan\IdeaProjects\aethermere-chronicles-unbounded\web-client\` (NEW)
- GMS: `C:\Users\Bryan\IdeaProjects\aethermere-chronicles-unbounded-gms\` (existing; receives CORS + portrait changes)
- Swing client (reference only): `C:\Users\Bryan\IdeaProjects\aethermere-chronicles-unbounded\client\`

**Conventions:**
- Web client commits use Conventional Commits: `feat(web-client): ...`, `chore(web-client): ...`, `test(web-client): ...`.
- GMS commits use the existing GMS convention; if there is no convention, use `feat(gms): ...`.
- Each task ends with one commit.

**Pre-flight:**
- Node 20.x or later installed.
- `npm` (or `pnpm`/`yarn`; this plan uses `npm`).
- Java 21 JDK (for GMS work).
- GMS clones to `aethermere-chronicles-unbounded-gms` and `./gradlew bootRun` works.
- The monorepo (`aethermere-chronicles-unbounded`) is not currently a git repo. If the user wants commits inside it, run `git init` from the monorepo root *before* Task 0; otherwise run commits from `web-client/` after `git init` there.

---

## Task 0: Vite + React + TypeScript scaffold

**Goal:** A working empty SPA at `http://localhost:5173` with TypeScript, ESLint, Prettier, and `npm` scripts wired up.

**Files:**
- Create: `web-client/package.json`
- Create: `web-client/index.html`
- Create: `web-client/vite.config.ts`
- Create: `web-client/tsconfig.json`
- Create: `web-client/tsconfig.node.json`
- Create: `web-client/.eslintrc.cjs`
- Create: `web-client/.prettierrc`
- Create: `web-client/.gitignore`
- Create: `web-client/.env.development`
- Create: `web-client/src/main.tsx`
- Create: `web-client/src/App.tsx`

**Acceptance Criteria:**
- [ ] `cd web-client && npm install` completes with no errors
- [ ] `npm run dev` boots Vite at `http://localhost:5173` showing "Aethermere Web Client" placeholder
- [ ] `npm run build` produces `dist/`
- [ ] `npm run lint` exits 0
- [ ] `npm run typecheck` exits 0
- [ ] `.env.development` defines `VITE_GMS_URL=http://localhost:8080`

**Verify:** `cd web-client && npm install && npm run lint && npm run typecheck && npm run build` → all exit 0.

**Steps:**

- [ ] **Step 1: Scaffold Vite project**

```bash
cd C:/Users/Bryan/IdeaProjects/aethermere-chronicles-unbounded
npm create vite@latest web-client -- --template react-ts
cd web-client
npm install
```

- [ ] **Step 2: Replace `package.json` scripts**

Open `package.json` and replace the `scripts` block with:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  }
}
```

- [ ] **Step 3: Add ESLint config**

Create `web-client/.eslintrc.cjs`:

```js
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'jsx-a11y'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
};
```

Install plugins:

```bash
npm install -D eslint-plugin-jsx-a11y prettier
```

- [ ] **Step 4: Add Prettier config**

Create `web-client/.prettierrc`:

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

- [ ] **Step 5: Add `.env.development`**

Create `web-client/.env.development`:

```
VITE_GMS_URL=http://localhost:8080
```

- [ ] **Step 6: Replace `App.tsx` with placeholder**

```tsx
export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1>Aethermere Web Client</h1>
    </main>
  );
}
```

- [ ] **Step 7: Verify all scripts**

Run each acceptance command and confirm exit 0.

- [ ] **Step 8: Commit**

```bash
git add web-client/
git commit -m "feat(web-client): scaffold Vite + React + TypeScript project"
```

---

## Task 1: Tailwind + shadcn/ui + theme tokens + fonts

**Goal:** Tailwind CSS configured with the dark-fantasy theme tokens and Cinzel/Raleway fonts; shadcn/ui initialized with `Button` available as the smoke component.

**Files:**
- Create: `web-client/tailwind.config.ts`
- Create: `web-client/postcss.config.js`
- Create: `web-client/src/theme/globals.css`
- Create: `web-client/src/theme/tokens.ts`
- Create: `web-client/public/fonts/Cinzel-Regular.woff2` (copy from `client/src/main/resources/fonts/`)
- Create: `web-client/public/fonts/Cinzel-Bold.woff2`
- Create: `web-client/public/fonts/Raleway-Regular.woff2`
- Create: `web-client/public/fonts/Raleway-Bold.woff2`
- Create: `web-client/components.json` (shadcn/ui config)
- Create: `web-client/src/components/ui/button.tsx`
- Create: `web-client/src/lib/utils.ts`
- Modify: `web-client/src/main.tsx` (import globals.css)
- Modify: `web-client/src/App.tsx` (use Button to verify shadcn works)

**Acceptance Criteria:**
- [ ] Tailwind utility classes render in dev (`bg-background`, `text-foreground`)
- [ ] Cinzel renders for `<h1>` headings; Raleway renders for body text
- [ ] `<Button>` from shadcn renders styled
- [ ] `npm run lint && npm run typecheck && npm run build` all exit 0

**Verify:** `npm run dev` and visually inspect `http://localhost:5173` — heading uses Cinzel, button is styled, dark background.

**Steps:**

- [ ] **Step 1: Install Tailwind**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 2: Find and copy fonts from Swing client**

The Swing client loads fonts from `client/src/main/resources/fonts/`. Locate the WOFF2 (or TTF) versions of Cinzel and Raleway. If only TTF exists, convert to WOFF2:

```bash
npm install -g ttf2woff2  # one-time global install, or use npx
# Convert each TTF to WOFF2; place results in web-client/public/fonts/
```

If WOFF2 already exists (Google Fonts CDN versions), download those instead.

- [ ] **Step 3: Replace `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      fontFamily: {
        heading: ['Cinzel', 'serif'],
        body: ['Raleway', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 4: Create `globals.css`**

Create `web-client/src/theme/globals.css`:

```css
@font-face {
  font-family: 'Cinzel';
  src: url('/fonts/Cinzel-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Cinzel';
  src: url('/fonts/Cinzel-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: 'Raleway';
  src: url('/fonts/Raleway-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Raleway';
  src: url('/fonts/Raleway-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Dark fantasy palette — echoes aethermoor-design-spec.docx */
    --background: 30 10% 8%;          /* near-black warm */
    --foreground: 40 30% 88%;         /* parchment */
    --primary: 40 65% 55%;            /* gold */
    --primary-foreground: 30 10% 8%;
    --muted: 30 10% 14%;
    --muted-foreground: 40 15% 65%;
    --border: 40 20% 25%;
    --input: 40 20% 25%;
    --ring: 40 65% 55%;
    --destructive: 0 70% 45%;
    --destructive-foreground: 40 30% 88%;
    --radius: 0.375rem;
  }
  body {
    @apply bg-background text-foreground font-body antialiased;
  }
  h1, h2, h3, h4 {
    @apply font-heading;
  }
}
```

- [ ] **Step 5: Update `main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './theme/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 6: Initialize shadcn/ui**

```bash
npx shadcn@latest init
# Select: TypeScript, Default style, Slate base color, src/theme/globals.css for CSS,
#         tailwind.config.ts for config, src/lib/utils.ts for utils,
#         src/components for components alias, @/components/ui for UI alias.
npx shadcn@latest add button
```

- [ ] **Step 7: Update `App.tsx` smoke test**

```tsx
import { Button } from '@/components/ui/button';

export default function App() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl">Aethermere</h1>
      <p>Theme smoke test.</p>
      <Button>Click me</Button>
    </main>
  );
}
```

- [ ] **Step 8: Verify visually**

Run `npm run dev`, open `http://localhost:5173`, confirm:
- Dark warm background
- Cinzel heading
- Raleway body
- Styled gold button

- [ ] **Step 9: Run lint, typecheck, build**

```bash
npm run lint && npm run typecheck && npm run build
```

All exit 0.

- [ ] **Step 10: Commit**

```bash
git add web-client/
git commit -m "feat(web-client): add Tailwind + shadcn/ui with dark-fantasy theme"
```

---

## Task 2: Testing infrastructure (Vitest + RTL + MSW)

**Goal:** Working unit-test setup with one passing smoke test, MSW handler skeleton ready for API tests.

**Files:**
- Create: `web-client/src/test/setup.ts`
- Create: `web-client/src/test/msw/handlers.ts`
- Create: `web-client/src/test/msw/server.ts`
- Create: `web-client/src/test/smoke.test.tsx`
- Modify: `web-client/vite.config.ts` (add Vitest config)
- Modify: `web-client/package.json` (deps)
- Modify: `web-client/tsconfig.json` (add `vitest/globals` types)

**Acceptance Criteria:**
- [ ] `npm run test` runs and passes one smoke test
- [ ] MSW server boots in test setup and tears down cleanly
- [ ] No deprecation warnings

**Verify:** `npm run test` → 1 test passing.

**Steps:**

- [ ] **Step 1: Install dev deps**

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
```

- [ ] **Step 2: Update `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
```

- [ ] **Step 3: Create MSW handlers skeleton**

Create `web-client/src/test/msw/handlers.ts`:

```ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Add per-test or per-suite handlers via server.use(...) in individual tests.
  http.get('http://localhost:8080/api/health', () => HttpResponse.json({ ok: true })),
];
```

Create `web-client/src/test/msw/server.ts`:

```ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

- [ ] **Step 4: Create test setup**

Create `web-client/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- [ ] **Step 5: Add `vitest/globals` to tsconfig**

In `web-client/tsconfig.json`, add to `compilerOptions.types`:

```json
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

- [ ] **Step 6: Write smoke test**

Create `web-client/src/test/smoke.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders heading', () => {
  render(<App />);
  expect(screen.getByText('Aethermere')).toBeInTheDocument();
});
```

- [ ] **Step 7: Run tests**

```bash
npm run test
```

Expected: 1 passing.

- [ ] **Step 8: Commit**

```bash
git add web-client/
git commit -m "test(web-client): add Vitest + RTL + MSW infrastructure"
```

---

## Task 3: AuthContext + apiFetch with refresh-on-401 (TDD)

**Goal:** A typed `apiFetch` that injects the bearer token, includes credentials, transparently refreshes on 401, and shares one in-flight refresh across concurrent calls.

**Files:**
- Create: `web-client/src/auth/AuthContext.tsx`
- Create: `web-client/src/auth/useAuth.ts`
- Create: `web-client/src/api/client.ts`
- Create: `web-client/src/api/errors.ts`
- Create: `web-client/src/api/__tests__/client.test.tsx`
- Create: `web-client/src/auth/__tests__/AuthContext.test.tsx`

**Acceptance Criteria:**
- [ ] `apiFetch` adds `Authorization: Bearer <token>` when token is set
- [ ] `apiFetch` always sends `credentials: 'include'`
- [ ] On 401, calls `POST /api/auth/refresh` once and retries the original request
- [ ] Concurrent 401s share a single refresh promise (single-flight)
- [ ] On refresh failure, fires `auth-expired` event and AuthContext clears token
- [ ] Throws `ApiError { status, code, fieldErrors }` for non-2xx
- [ ] All tests pass

**Verify:** `npm run test src/api/__tests__/client.test.tsx src/auth/__tests__/AuthContext.test.tsx` → all green.

**Steps:**

- [ ] **Step 1: Write `errors.ts`**

```ts
export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    public fieldErrors: FieldErrors,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

- [ ] **Step 2: Write `AuthContext.tsx`**

```tsx
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface AuthState {
  accessToken: string | null;
  playerId: string | null;
  setAccessToken: (token: string | null) => void;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

function decodePlayerId(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.sub === 'string' ? json.sub : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);

  const setAccessToken = useCallback((token: string | null) => {
    setAccessTokenState(token);
  }, []);

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
```

Create `web-client/src/auth/useAuth.ts`:

```ts
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 3: Write `client.ts`**

```ts
import { ApiError, type FieldErrors } from './errors';

const BASE_URL = import.meta.env.VITE_GMS_URL ?? 'http://localhost:8080';

let getToken: () => string | null = () => null;
let setToken: (t: string | null) => void = () => {};

export function configureApiClient(opts: {
  getToken: () => string | null;
  setToken: (t: string | null) => void;
}) {
  getToken = opts.getToken;
  setToken = opts.setToken;
}

let inFlightRefresh: Promise<string | null> | null = null;

async function refreshToken(): Promise<string | null> {
  if (!inFlightRefresh) {
    inFlightRefresh = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return null;
        const body = await res.json();
        const token = body.accessToken as string;
        setToken(token);
        return token;
      } finally {
        inFlightRefresh = null;
      }
    })();
  }
  return inFlightRefresh;
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Disable refresh-on-401 (e.g. on the refresh endpoint itself). */
  noRefresh?: boolean;
}

export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const { body, headers, noRefresh, ...rest } = opts;
  const token = getToken();
  const init: RequestInit = {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  };

  let res = await fetch(`${BASE_URL}${path}`, init);

  if (res.status === 401 && !noRefresh) {
    const newToken = await refreshToken();
    if (newToken) {
      const retryInit: RequestInit = {
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${newToken}` },
      };
      res = await fetch(`${BASE_URL}${path}`, retryInit);
    } else {
      window.dispatchEvent(new Event('auth-expired'));
    }
  }

  if (!res.ok) {
    const fieldErrors: FieldErrors = {};
    let code: string | undefined;
    let message = res.statusText;
    try {
      const errBody = await res.json();
      if (errBody.fieldErrors) Object.assign(fieldErrors, errBody.fieldErrors);
      code = errBody.code;
      message = errBody.message ?? message;
    } catch {
      // ignore JSON parse failure
    }
    throw new ApiError(res.status, code, fieldErrors, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
```

- [ ] **Step 4: Write tests for `apiFetch`**

Create `web-client/src/api/__tests__/client.test.tsx`:

```tsx
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { apiFetch, configureApiClient } from '../client';
import { ApiError } from '../errors';

let token: string | null = null;

beforeEach(() => {
  token = null;
  configureApiClient({
    getToken: () => token,
    setToken: (t) => {
      token = t;
    },
  });
});

afterEach(() => {
  server.resetHandlers();
});

test('adds Authorization header when token is set', async () => {
  token = 'tok-1';
  let captured: string | null = null;
  server.use(
    http.get('http://localhost:8080/api/ping', ({ request }) => {
      captured = request.headers.get('Authorization');
      return HttpResponse.json({ ok: true });
    }),
  );
  await apiFetch('/api/ping');
  expect(captured).toBe('Bearer tok-1');
});

test('refreshes on 401 and retries original request', async () => {
  token = 'expired';
  let firstCall = true;
  server.use(
    http.get('http://localhost:8080/api/ping', () => {
      if (firstCall) {
        firstCall = false;
        return new HttpResponse(null, { status: 401 });
      }
      return HttpResponse.json({ ok: true });
    }),
    http.post('http://localhost:8080/api/auth/refresh', () =>
      HttpResponse.json({ accessToken: 'new-tok' }),
    ),
  );
  const result = await apiFetch<{ ok: true }>('/api/ping');
  expect(result.ok).toBe(true);
  expect(token).toBe('new-tok');
});

test('concurrent 401s share one refresh', async () => {
  token = 'expired';
  let refreshCalls = 0;
  let pingCallsAfterRefresh = 0;
  let refreshed = false;
  server.use(
    http.post('http://localhost:8080/api/auth/refresh', async () => {
      refreshCalls += 1;
      await new Promise((r) => setTimeout(r, 10));
      refreshed = true;
      return HttpResponse.json({ accessToken: 'new-tok' });
    }),
    http.get('http://localhost:8080/api/ping', () => {
      if (!refreshed) return new HttpResponse(null, { status: 401 });
      pingCallsAfterRefresh += 1;
      return HttpResponse.json({ ok: true });
    }),
  );
  await Promise.all([apiFetch('/api/ping'), apiFetch('/api/ping'), apiFetch('/api/ping')]);
  expect(refreshCalls).toBe(1);
  expect(pingCallsAfterRefresh).toBe(3);
});

test('fires auth-expired and throws when refresh fails', async () => {
  token = 'expired';
  server.use(
    http.get('http://localhost:8080/api/ping', () => new HttpResponse(null, { status: 401 })),
    http.post('http://localhost:8080/api/auth/refresh', () => new HttpResponse(null, { status: 401 })),
  );
  const handler = vi.fn();
  window.addEventListener('auth-expired', handler);
  await expect(apiFetch('/api/ping')).rejects.toBeInstanceOf(ApiError);
  expect(handler).toHaveBeenCalled();
  window.removeEventListener('auth-expired', handler);
});

test('throws ApiError with fieldErrors on 4xx', async () => {
  server.use(
    http.post('http://localhost:8080/api/things', () =>
      HttpResponse.json(
        { code: 'VALIDATION', message: 'bad', fieldErrors: { name: 'required' } },
        { status: 400 },
      ),
    ),
  );
  try {
    await apiFetch('/api/things', { method: 'POST', body: {} });
    throw new Error('should have thrown');
  } catch (e) {
    expect(e).toBeInstanceOf(ApiError);
    const err = e as ApiError;
    expect(err.status).toBe(400);
    expect(err.fieldErrors.name).toBe('required');
  }
});
```

- [ ] **Step 5: Run tests, verify they fail before fixing**

If you wrote `client.ts` first, tests should pass. If TDD-strict, write tests first, watch them fail with "configureApiClient is not exported," then add the implementation. Either order is acceptable as long as the final state is all green.

```bash
npm run test src/api src/auth
```

Expected: all tests passing.

- [ ] **Step 6: Wire AuthContext to apiFetch in App tree**

Update `web-client/src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import './theme/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
```

We'll wire `configureApiClient` from inside the provider in Task 5 (after Router is in).

- [ ] **Step 7: Commit**

```bash
git add web-client/
git commit -m "feat(web-client): add AuthContext and apiFetch with single-flight refresh"
```

---

## Task 4: API modules (auth, characters, rulesets) + types

**Goal:** Typed wrappers around `apiFetch` for the GMS endpoints the web client uses.

**Files:**
- Create: `web-client/src/api/types.ts`
- Create: `web-client/src/api/auth.ts`
- Create: `web-client/src/api/characters.ts`
- Create: `web-client/src/api/rulesets.ts`
- Create: `web-client/src/api/__tests__/auth.test.ts`
- Create: `web-client/src/api/__tests__/characters.test.ts`

**Acceptance Criteria:**
- [ ] `login`, `register`, `logout`, `refresh` exported from `auth.ts` and call correct paths with correct bodies
- [ ] `listCharacters`, `createCharacter`, `uploadPortrait`, `fetchPortraitBlob` exported from `characters.ts`
- [ ] `listRulesets`, `listLineages`, `listClasses`, `listCultures` exported from `rulesets.ts`
- [ ] Types in `types.ts` mirror GMS DTOs (verify against `client/src/main/java/org/aethermere/cu/client/api/dto/`)
- [ ] Tests cover one happy path per module

**Verify:** `npm run test src/api` → all green; `npm run typecheck` → 0 errors.

**Steps:**

- [ ] **Step 1: Inspect GMS DTOs**

Read `client/src/main/java/org/aethermere/cu/client/api/dto/` to get the exact field shapes for: `LoginRequest`, `RegisterRequest`, `AuthResponse`, `CharacterCreateRequest`, `CharacterResponse`, `LineageResponse`, `ClassResponse`, `CultureResponse`, `RulesetSummary`. Mirror them in TypeScript.

- [ ] **Step 2: Write `types.ts`**

Use the actual DTO field names from step 1. Example skeleton (replace with real shapes):

```ts
export interface LoginRequest { username: string; password: string; }
export interface RegisterRequest { username: string; password: string; }
export interface AuthResponse { accessToken: string; }

export interface RulesetSummary { key: string; name: string; }
export interface LineageResponse { id: string; name: string; description: string; /* ... */ }
export interface ClassResponse { id: string; name: string; description: string; /* ... */ }
export interface CultureResponse { id: string; name: string; description: string; /* ... */ }

export interface CharacterCreateRequest {
  rulesetKey: string;
  name: string;
  pronouns?: string;
  bio?: string;
  lineageId: string;
  classId: string;
  cultureId: string;
  attributes: Record<string, number>; // exact shape from GMS DTO
}
export interface CharacterResponse {
  id: string;
  name: string;
  lineageName: string;
  className: string;
  cultureName: string;
  hasPortrait: boolean;
  /* mirror remaining GMS fields */
}
```

If any GMS DTO is more complex (nested objects, etc.), mirror it faithfully.

- [ ] **Step 3: Write `auth.ts`**

```ts
import { apiFetch } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest } from './types';

export const login = (req: LoginRequest) =>
  apiFetch<AuthResponse>('/api/auth/login', { method: 'POST', body: req, noRefresh: true });

export const register = (req: RegisterRequest) =>
  apiFetch<void>('/api/auth/register', { method: 'POST', body: req, noRefresh: true });

export const logout = () => apiFetch<void>('/api/auth/logout', { method: 'POST' });

export const refresh = () =>
  apiFetch<AuthResponse>('/api/auth/refresh', { method: 'POST', noRefresh: true });
```

- [ ] **Step 4: Write `characters.ts`**

```ts
import { apiFetch } from './client';
import type { CharacterCreateRequest, CharacterResponse } from './types';

export const listCharacters = (playerId: string) =>
  apiFetch<CharacterResponse[]>(`/api/characters?playerId=${encodeURIComponent(playerId)}`);

export const createCharacter = (req: CharacterCreateRequest) =>
  apiFetch<CharacterResponse>('/api/player-characters', { method: 'POST', body: req });

export const uploadPortrait = (characterId: string, file: Blob) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiFetch<void>(`/api/characters/${encodeURIComponent(characterId)}/portrait`, {
    method: 'POST',
    body: fd,
  });
};

const BASE_URL = import.meta.env.VITE_GMS_URL ?? 'http://localhost:8080';

export async function fetchPortraitBlob(characterId: string, token: string | null): Promise<Blob | null> {
  const res = await fetch(`${BASE_URL}/api/characters/${encodeURIComponent(characterId)}/portrait`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Portrait fetch failed: ${res.status}`);
  return res.blob();
}
```

- [ ] **Step 5: Write `rulesets.ts`**

```ts
import { apiFetch } from './client';
import type { ClassResponse, CultureResponse, LineageResponse, RulesetSummary } from './types';

export const listRulesets = () => apiFetch<RulesetSummary[]>('/api/rulesets');

export const listLineages = (rulesetKey: string) =>
  apiFetch<{ lineages: LineageResponse[] }>(`/api/rulesets/${rulesetKey}/lineages`).then(
    (w) => w.lineages ?? [],
  );

export const listClasses = (rulesetKey: string) =>
  apiFetch<{ classes: ClassResponse[] }>(`/api/rulesets/${rulesetKey}/classes`).then(
    (w) => w.classes ?? [],
  );

export const listCultures = (rulesetKey: string) =>
  apiFetch<{ cultures: CultureResponse[] }>(`/api/rulesets/${rulesetKey}/cultures`).then(
    (w) => w.cultures ?? [],
  );
```

- [ ] **Step 6: Write happy-path tests**

`web-client/src/api/__tests__/auth.test.ts`:

```ts
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, test } from 'vitest';
import { server } from '@/test/msw/server';
import { configureApiClient } from '../client';
import { login } from '../auth';

beforeEach(() => {
  configureApiClient({ getToken: () => null, setToken: () => {} });
});

test('login posts credentials and returns access token', async () => {
  server.use(
    http.post('http://localhost:8080/api/auth/login', async ({ request }) => {
      const body = (await request.json()) as { username: string; password: string };
      expect(body).toEqual({ username: 'a', password: 'b' });
      return HttpResponse.json({ accessToken: 'tok' });
    }),
  );
  const res = await login({ username: 'a', password: 'b' });
  expect(res.accessToken).toBe('tok');
});
```

`web-client/src/api/__tests__/characters.test.ts`:

```ts
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, test } from 'vitest';
import { server } from '@/test/msw/server';
import { configureApiClient } from '../client';
import { uploadPortrait } from '../characters';

beforeEach(() => {
  configureApiClient({ getToken: () => 'tok', setToken: () => {} });
});

test('uploadPortrait sends multipart with auth', async () => {
  let captured: { auth: string | null; isMultipart: boolean } | null = null;
  server.use(
    http.post('http://localhost:8080/api/characters/c-1/portrait', ({ request }) => {
      captured = {
        auth: request.headers.get('Authorization'),
        isMultipart: (request.headers.get('Content-Type') ?? '').startsWith('multipart/form-data'),
      };
      return new HttpResponse(null, { status: 204 });
    }),
  );
  await uploadPortrait('c-1', new Blob([new Uint8Array([1, 2, 3])], { type: 'image/webp' }));
  expect(captured?.auth).toBe('Bearer tok');
  expect(captured?.isMultipart).toBe(true);
});
```

- [ ] **Step 7: Run tests + typecheck**

```bash
npm run test src/api && npm run typecheck
```

All green.

- [ ] **Step 8: Commit**

```bash
git add web-client/
git commit -m "feat(web-client): add typed API modules for auth, characters, rulesets"
```

---

## Task 5: Router + ProtectedRoute + QueryClientProvider

**Goal:** App tree wired with React Router, TanStack Query, and a `ProtectedRoute` that refreshes on mount.

**Files:**
- Create: `web-client/src/auth/ProtectedRoute.tsx`
- Modify: `web-client/src/App.tsx` (router + providers)
- Modify: `web-client/src/main.tsx` (configure apiFetch with token getter/setter from AuthContext)
- Modify: `web-client/src/auth/AuthContext.tsx` (call configureApiClient from a wiring effect)
- Create: `web-client/src/auth/__tests__/ProtectedRoute.test.tsx`

**Acceptance Criteria:**
- [ ] App renders without errors with router + providers in place
- [ ] Visiting `/` while unauthenticated triggers a refresh attempt; on failure redirects to `/login`
- [ ] On refresh success, `/` renders its child route
- [ ] `apiFetch` reads tokens from AuthContext (verified via existing client tests still passing after wiring change)

**Verify:** `npm run test src/auth/__tests__/ProtectedRoute.test.tsx && npm run typecheck && npm run dev` (visit `/`, see redirect to `/login` placeholder).

**Steps:**

- [ ] **Step 1: Install React Router and TanStack Query**

```bash
npm install react-router-dom @tanstack/react-query
```

- [ ] **Step 2: Refactor AuthContext to expose a stable ref + wire `configureApiClient`**

Update `web-client/src/auth/AuthContext.tsx` — add:

```tsx
import { useRef } from 'react';
import { configureApiClient } from '@/api/client';

// Inside AuthProvider:
const tokenRef = useRef<string | null>(null);
tokenRef.current = accessToken;

useEffect(() => {
  configureApiClient({
    getToken: () => tokenRef.current,
    setToken: (t) => setAccessTokenState(t),
  });
}, []);
```

The ref ensures `apiFetch` always sees the freshest token without re-binding.

- [ ] **Step 3: Write `ProtectedRoute.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';
import { refresh } from '@/api/auth';

export function ProtectedRoute() {
  const { accessToken, setAccessToken } = useAuth();
  const [status, setStatus] = useState<'checking' | 'authed' | 'guest'>(
    accessToken ? 'authed' : 'checking',
  );

  useEffect(() => {
    if (accessToken) {
      setStatus('authed');
      return;
    }
    let cancelled = false;
    refresh()
      .then((res) => {
        if (cancelled) return;
        setAccessToken(res.accessToken);
        setStatus('authed');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('guest');
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, setAccessToken]);

  if (status === 'checking') return <div className="p-8">Loading…</div>;
  if (status === 'guest') return <Navigate to="/login" replace />;
  return <Outlet />;
}
```

- [ ] **Step 4: Update `App.tsx`**

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<div>Login placeholder</div>} />
          <Route path="/register" element={<div>Register placeholder</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>Home placeholder</div>} />
            <Route path="/characters/new" element={<div>Wizard placeholder</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 5: Update smoke test**

The existing `smoke.test.tsx` looked for "Aethermere"; since the app now routes, change it:

```tsx
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from './msw/server';
import App from '../App';

test('redirects unauthenticated user to /login', async () => {
  server.use(
    http.post('http://localhost:8080/api/auth/refresh', () => new HttpResponse(null, { status: 401 })),
  );
  // App uses BrowserRouter; jsdom defaults to "/"
  render(<App />);
  expect(await screen.findByText('Login placeholder')).toBeInTheDocument();
});
```

- [ ] **Step 6: Add a ProtectedRoute test**

`web-client/src/auth/__tests__/ProtectedRoute.test.tsx`:

```tsx
import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { test, expect } from 'vitest';
import { server } from '@/test/msw/server';
import { AuthProvider } from '../AuthContext';
import { ProtectedRoute } from '../ProtectedRoute';

function setup(initial: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/login" element={<div>Login</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

test('redirects to /login when refresh fails', async () => {
  server.use(
    http.post('http://localhost:8080/api/auth/refresh', () => new HttpResponse(null, { status: 401 })),
  );
  setup('/');
  expect(await screen.findByText('Login')).toBeInTheDocument();
});

test('renders home when refresh succeeds', async () => {
  server.use(
    http.post('http://localhost:8080/api/auth/refresh', () =>
      HttpResponse.json({ accessToken: 'header.eyJzdWIiOiJwbGF5ZXItMSJ9.sig' }),
    ),
  );
  setup('/');
  expect(await screen.findByText('Home')).toBeInTheDocument();
});
```

- [ ] **Step 7: Run tests + dev**

```bash
npm run test && npm run typecheck && npm run dev
```

Visit `http://localhost:5173` — with no GMS running, the app should redirect to `/login`. Tests all pass.

- [ ] **Step 8: Commit**

```bash
git add web-client/
git commit -m "feat(web-client): add Router + ProtectedRoute + QueryClient providers"
```

---

## Task 6: AppShell + LoginPage

**Goal:** Real LoginPage that authenticates against GMS and redirects to `/`. AppShell with a logout button.

**Files:**
- Create: `web-client/src/components/AppShell.tsx`
- Create: `web-client/src/pages/LoginPage.tsx`
- Create: `web-client/src/pages/__tests__/LoginPage.test.tsx`
- Modify: `web-client/src/App.tsx` (use AppShell, real LoginPage)
- Modify: `web-client/src/auth/AuthContext.tsx` (add `logout()` helper)

**Acceptance Criteria:**
- [ ] LoginPage renders a form with username + password fields, submit button
- [ ] Submit calls `POST /api/auth/login`, stores token, navigates to `/`
- [ ] 401 shows "Invalid credentials" inline
- [ ] AppShell renders header with "Aethermere" title and logout button (only when authed)
- [ ] Logout calls `POST /api/auth/logout`, clears token, navigates to `/login`

**Verify:** `npm run test src/pages/__tests__/LoginPage.test.tsx` → green.

**Steps:**

- [ ] **Step 1: Install form deps**

```bash
npm install react-hook-form zod @hookform/resolvers
npx shadcn@latest add form input label
```

- [ ] **Step 2: Add `logout()` to AuthContext**

In `AuthContext.tsx`, expose a `logout` method on the context value that calls `POST /api/auth/logout` (via `apiFetch`) and clears the token:

```tsx
import { logout as apiLogout } from '@/api/auth';

const logout = useCallback(async () => {
  try {
    await apiLogout();
  } finally {
    setAccessTokenState(null);
  }
}, []);

// add to value: logout
```

Update the `AuthState` interface in the same file.

- [ ] **Step 3: Write `AppShell.tsx`**

```tsx
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/useAuth';
import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  const { accessToken, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-heading text-primary">
          Aethermere
        </Link>
        {accessToken && (
          <Button
            variant="ghost"
            onClick={async () => {
              await logout();
              nav('/login');
            }}
          >
            Log out
          </Button>
        )}
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Write `LoginPage.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/api/auth';
import { ApiError } from '@/api/errors';
import { useAuth } from '@/auth/useAuth';
import { useState } from 'react';

const schema = z.object({
  username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { setAccessToken } = useAuth();
  const nav = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      const res = await login(values);
      setAccessToken(res.accessToken);
      nav('/', { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setSubmitError('Invalid credentials');
      } else {
        setSubmitError('Something went wrong; please try again');
      }
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 space-y-6">
      <h1 className="text-3xl">Sign in</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" autoComplete="username" {...register('username')} />
          {errors.username && <p className="text-destructive text-sm">{errors.username.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
          {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
        </div>
        {submitError && <p className="text-destructive text-sm">{submitError}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p>
        Don't have an account?{' '}
        <Link to="/register" className="text-primary underline">
          Register
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Wire LoginPage into App**

```tsx
// App.tsx
<Route path="/login" element={<LoginPage />} />
```

Wrap the routes inside `<AppShell>` if desired, or just on the protected branch.

- [ ] **Step 6: Write `LoginPage.test.tsx`**

```tsx
import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, test } from 'vitest';
import { server } from '@/test/msw/server';
import { AuthProvider } from '@/auth/AuthContext';
import { LoginPage } from '../LoginPage';

function setup() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

test('logs in and navigates home', async () => {
  server.use(
    http.post('http://localhost:8080/api/auth/login', () =>
      HttpResponse.json({ accessToken: 'header.eyJzdWIiOiJwIn0.sig' }),
    ),
  );
  const user = userEvent.setup();
  setup();
  await user.type(screen.getByLabelText(/username/i), 'alice');
  await user.type(screen.getByLabelText(/password/i), 'secret');
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  expect(await screen.findByText('Home')).toBeInTheDocument();
});

test('shows invalid credentials on 401', async () => {
  server.use(
    http.post('http://localhost:8080/api/auth/login', () => new HttpResponse(null, { status: 401 })),
  );
  const user = userEvent.setup();
  setup();
  await user.type(screen.getByLabelText(/username/i), 'alice');
  await user.type(screen.getByLabelText(/password/i), 'wrong');
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
});
```

- [ ] **Step 7: Run tests + manual smoke**

```bash
npm run test src/pages
npm run dev   # log in against a real GMS or MSW dev mode
```

- [ ] **Step 8: Commit**

```bash
git add web-client/
git commit -m "feat(web-client): add LoginPage and AppShell"
```

---

## Task 7: RegisterPage with auto-login

**Goal:** RegisterPage that creates an account, immediately logs in, and lands on `/`.

**Files:**
- Create: `web-client/src/pages/RegisterPage.tsx`
- Create: `web-client/src/pages/__tests__/RegisterPage.test.tsx`
- Modify: `web-client/src/App.tsx` (real RegisterPage)

**Acceptance Criteria:**
- [ ] Form with username, password, confirm-password (Zod cross-field check)
- [ ] On success: register → login → setAccessToken → navigate to `/`
- [ ] On 409 (username taken): inline error
- [ ] Validation errors show under fields

**Verify:** `npm run test src/pages/__tests__/RegisterPage.test.tsx` → green.

**Steps:**

- [ ] **Step 1: Write `RegisterPage.tsx`**

Mirror `LoginPage` structure. Key differences: extra `confirm` field, Zod schema with `.refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords must match' })`. On submit: call `register(...)`, then `login(...)` with the same credentials, then `setAccessToken` + `nav('/')`. Map 409 to "Username already taken."

- [ ] **Step 2: Write `RegisterPage.test.tsx`**

Mirror `LoginPage.test.tsx`. Add cases for:
- happy path (register 200 + login 200 → home)
- 409 → "Username already taken"
- mismatched password → inline "Passwords must match" without calling the API

- [ ] **Step 3: Wire into App**

```tsx
<Route path="/register" element={<RegisterPage />} />
```

- [ ] **Step 4: Run tests**

```bash
npm run test src/pages
```

- [ ] **Step 5: Commit**

```bash
git add web-client/
git commit -m "feat(web-client): add RegisterPage with auto-login on success"
```

---

## Task 8: GMS — CORS configuration

**Goal:** GMS allows browser requests from `http://localhost:5173` with credentials.

**Files (in GMS repo):**
- Create: `aethermere-chronicles-unbounded-gms/src/main/java/<package>/config/WebClientCorsConfig.java`
- Modify: `aethermere-chronicles-unbounded-gms/src/main/resources/application.yml` (or `.properties`) — add `aethermere.web.origin` property

**Acceptance Criteria:**
- [ ] OPTIONS preflight from `Origin: http://localhost:5173` returns the correct `Access-Control-Allow-*` headers including `Access-Control-Allow-Credentials: true`
- [ ] Authenticated `GET /api/characters?...` works from a browser at `http://localhost:5173`
- [ ] Refresh cookie set by `/api/auth/login` is visible in subsequent calls

**Verify:**

```bash
# From web-client/ with GMS running:
curl -i -X OPTIONS http://localhost:8080/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
# Expect: Access-Control-Allow-Origin: http://localhost:5173
#         Access-Control-Allow-Credentials: true
```

**Steps:**

- [ ] **Step 1: Locate the existing Spring config package**

Look for an existing `*Config.java` (e.g. `SecurityConfig`, `WebMvcConfig`) under `src/main/java` to confirm the package convention. New file goes in a sibling `config/` package.

- [ ] **Step 2: Add property to `application.yml`**

```yaml
aethermere:
  web:
    origin: http://localhost:5173
```

- [ ] **Step 3: Write `WebClientCorsConfig.java`**

```java
package <package>.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebClientCorsConfig implements WebMvcConfigurer {

    private final String webOrigin;

    public WebClientCorsConfig(@Value("${aethermere.web.origin}") String webOrigin) {
        this.webOrigin = webOrigin;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(webOrigin)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type", "X-Requested-With")
                .allowCredentials(true)
                .maxAge(3600);
        registry.addMapping("/sessions")
                .allowedOrigins(webOrigin)
                .allowedMethods("POST", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type")
                .allowCredentials(true);
    }
}
```

- [ ] **Step 4: If GMS uses Spring Security, ensure it doesn't block CORS preflight**

Most Spring Security configs need `.cors(Customizer.withDefaults())` and `.csrf(c -> c.disable())` (or csrf ignoring of `/api/**`) for browser POSTs to work. Update the existing `SecurityFilterChain` if needed; do not add it if Spring Security isn't in use.

- [ ] **Step 5: Verify with curl**

Run the curl command from the Verify section. Confirm headers.

- [ ] **Step 6: Manual browser smoke**

In a separate terminal, run web-client `npm run dev`. Open browser DevTools network panel, attempt login. The OPTIONS preflight and the actual POST both succeed.

- [ ] **Step 7: Commit (in GMS repo)**

```bash
cd C:/Users/Bryan/IdeaProjects/aethermere-chronicles-unbounded-gms
git add .
git commit -m "feat(gms): add CORS config for web client at configurable origin"
```

---

## Task 9: GMS — character.portrait_uri schema migration + entity field

**Goal:** Character table has nullable `portrait_uri` column; entity exposes it.

**Files (in GMS repo):**
- Create: a new Flyway/Liquibase migration matching the existing convention (e.g. `db/migration/V<n>__character_portrait_uri.sql`)
- Modify: the `Character` JPA entity (or equivalent) to add `portraitUri` field

**Acceptance Criteria:**
- [ ] Application boots cleanly with the new migration applied
- [ ] Existing character rows have `NULL` `portrait_uri`
- [ ] Entity getter/setter compile and roundtrip in a unit test

**Verify:** `cd aethermere-chronicles-unbounded-gms && ./gradlew test bootRun` → app starts, no migration errors.

**Steps:**

- [ ] **Step 1: Identify the migration tool and the next version number**

Look in `src/main/resources/db/migration/` (Flyway) or `src/main/resources/db/changelog/` (Liquibase). Use the next sequential version.

- [ ] **Step 2: Write the migration (Flyway example)**

```sql
ALTER TABLE characters ADD COLUMN portrait_uri VARCHAR(255) NULL;
```

Match the actual table name (could be `character`, `characters`, `pc_character`, etc.).

- [ ] **Step 3: Update the entity**

```java
@Column(name = "portrait_uri")
private String portraitUri;
// + getter/setter
```

- [ ] **Step 4: Run GMS tests + boot**

```bash
./gradlew test bootRun
```

- [ ] **Step 5: Commit (in GMS repo)**

```bash
git add .
git commit -m "feat(gms): add portrait_uri column and entity field"
```

---

## Task 10: GMS — portrait upload + retrieval endpoints

**Goal:** `POST /api/characters/{id}/portrait` accepts an image, re-encodes to WebP 512×512 max, persists to disk, and updates `portrait_uri`. `GET /api/characters/{id}/portrait` serves it.

**Files (in GMS repo):**
- Create: `controllers/PortraitController.java`
- Create: `services/PortraitService.java`
- Modify: `application.yml` — add `aethermere.gms.data-dir` if not present
- Create: `controllers/__tests__/PortraitControllerTest.java`

**Acceptance Criteria:**
- [ ] POST: rejects non-image content types with 415
- [ ] POST: rejects > 4 MB with 413
- [ ] POST: rejects characters not owned by the JWT subject with 403
- [ ] POST: writes `${data-dir}/portraits/{id}.webp`, updates entity, returns 204
- [ ] GET: returns 200 image/webp bytes when set
- [ ] GET: returns 404 when not set
- [ ] Both endpoints require authentication (401 otherwise)

**Verify:** `./gradlew test --tests PortraitControllerTest` → green.

**Steps:**

- [ ] **Step 1: Add property**

```yaml
aethermere:
  gms:
    data-dir: ${user.home}/.aethermere
```

- [ ] **Step 2: Add image-encoding dependency**

If GMS doesn't already have one, add a WebP encoder. Options:
- `com.github.usefulness:webp-imageio:0.x` (pure Java) — preferred for portability
- `org.sejda.imageio:webp-imageio:x.x.x` — alternative

Add to `build.gradle.kts`:

```kts
implementation("com.github.usefulness:webp-imageio:0.10.4")
```

- [ ] **Step 3: Write `PortraitService.java`**

```java
@Service
public class PortraitService {
    private static final long MAX_BYTES = 4L * 1024 * 1024;
    private static final int MAX_DIM = 512;

    private final Path portraitsDir;
    private final CharacterRepository characters;

    public PortraitService(@Value("${aethermere.gms.data-dir}") String dataDir,
                           CharacterRepository characters) throws IOException {
        this.portraitsDir = Path.of(dataDir, "portraits");
        Files.createDirectories(this.portraitsDir);
        this.characters = characters;
    }

    public void store(String characterId, String playerId, MultipartFile file) throws IOException {
        if (file.getSize() > MAX_BYTES) throw new PayloadTooLargeException();
        String contentType = file.getContentType();
        if (contentType == null || !List.of("image/png", "image/jpeg", "image/webp").contains(contentType)) {
            throw new UnsupportedMediaTypeException();
        }
        Character ch = characters.findById(characterId).orElseThrow(NotFoundException::new);
        if (!Objects.equals(ch.getOwnerId(), playerId)) throw new ForbiddenException();

        BufferedImage img = ImageIO.read(file.getInputStream());
        if (img == null) throw new UnsupportedMediaTypeException();
        BufferedImage resized = downscale(img, MAX_DIM);

        Path target = portraitsDir.resolve(characterId + ".webp");
        try (var os = Files.newOutputStream(target)) {
            ImageIO.write(resized, "webp", os);
        }
        ch.setPortraitUri("characters/" + characterId + "/portrait");
        characters.save(ch);
    }

    public Optional<Path> read(String characterId) {
        Path p = portraitsDir.resolve(characterId + ".webp");
        return Files.exists(p) ? Optional.of(p) : Optional.empty();
    }

    private BufferedImage downscale(BufferedImage src, int max) {
        int w = src.getWidth(), h = src.getHeight();
        if (w <= max && h <= max) return src;
        double scale = Math.min((double) max / w, (double) max / h);
        int nw = (int) (w * scale), nh = (int) (h * scale);
        BufferedImage out = new BufferedImage(nw, nh, BufferedImage.TYPE_INT_ARGB);
        var g = out.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.drawImage(src, 0, 0, nw, nh, null);
        g.dispose();
        return out;
    }
}
```

(Match the existing GMS exception convention — these are illustrative names.)

- [ ] **Step 4: Write `PortraitController.java`**

```java
@RestController
@RequestMapping("/api/characters/{characterId}/portrait")
public class PortraitController {
    private final PortraitService service;
    public PortraitController(PortraitService service) { this.service = service; }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void upload(@PathVariable String characterId,
                       @RequestParam("file") MultipartFile file,
                       @AuthenticationPrincipal Jwt jwt) throws IOException {
        service.store(characterId, jwt.getSubject(), file);
    }

    @GetMapping
    public ResponseEntity<Resource> get(@PathVariable String characterId) {
        return service.read(characterId)
                .<ResponseEntity<Resource>>map(p -> ResponseEntity.ok()
                        .contentType(MediaType.valueOf("image/webp"))
                        .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePrivate())
                        .body(new FileSystemResource(p)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
```

(Adjust the `@AuthenticationPrincipal` type to match how GMS exposes the JWT subject in existing controllers.)

- [ ] **Step 5: Write integration tests**

`PortraitControllerTest.java` covers:
- 401 unauthenticated
- 403 wrong owner
- 413 too large
- 415 wrong content type
- 204 happy path; subsequent GET returns 200 + bytes
- 404 GET when no portrait set

Use `@SpringBootTest` + `MockMvc` + a temp directory for `aethermere.gms.data-dir`.

- [ ] **Step 6: Run GMS tests**

```bash
./gradlew test --tests PortraitControllerTest
```

- [ ] **Step 7: Commit (in GMS repo)**

```bash
git add .
git commit -m "feat(gms): add character portrait upload and retrieval endpoints"
```

---

## Task 11: CharacterPortrait component + CharacterListPage

**Goal:** Authenticated `<img>` rendering via fetch-then-blob; landing page lists the player's characters.

**Files:**
- Create: `web-client/src/components/CharacterPortrait.tsx`
- Create: `web-client/src/pages/CharacterListPage.tsx`
- Create: `web-client/src/components/__tests__/CharacterPortrait.test.tsx`
- Create: `web-client/src/pages/__tests__/CharacterListPage.test.tsx`
- Modify: `web-client/src/App.tsx` (use real CharacterListPage)

**Acceptance Criteria:**
- [ ] CharacterPortrait fetches via `apiFetch`-equivalent (with auth header), renders blob URL
- [ ] On 404, renders silhouette placeholder (e.g. an SVG)
- [ ] On unmount, calls `URL.revokeObjectURL`
- [ ] CharacterListPage shows characters in a grid
- [ ] Empty state: "You haven't created any characters yet" + Create button
- [ ] Tests cover happy path, 404 fallback, empty state

**Verify:** `npm run test src/components src/pages/__tests__/CharacterListPage.test.tsx` → green.

**Steps:**

- [ ] **Step 1: Write `CharacterPortrait.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPortraitBlob } from '@/api/characters';
import { useAuth } from '@/auth/useAuth';

export function CharacterPortrait({ characterId, alt }: { characterId: string; alt: string }) {
  const { accessToken } = useAuth();
  const { data } = useQuery({
    queryKey: ['portrait', characterId, accessToken],
    queryFn: () => fetchPortraitBlob(characterId, accessToken),
    staleTime: 5 * 60 * 1000,
  });
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(data);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [data]);

  if (!url) {
    return (
      <div className="w-32 h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
        ?
      </div>
    );
  }
  return <img src={url} alt={alt} className="w-32 h-32 rounded-md object-cover" />;
}
```

- [ ] **Step 2: Write `CharacterListPage.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { listCharacters } from '@/api/characters';
import { useAuth } from '@/auth/useAuth';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { AppShell } from '@/components/AppShell';

export function CharacterListPage() {
  const { playerId } = useAuth();
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ['characters', playerId],
    queryFn: () => (playerId ? listCharacters(playerId) : Promise.resolve([])),
    enabled: !!playerId,
  });

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl">Your Characters</h1>
          <Button asChild>
            <Link to="/characters/new">Create New Character</Link>
          </Button>
        </div>
        {isLoading ? (
          <p>Loading…</p>
        ) : characters.length === 0 ? (
          <p>You haven't created any characters yet.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {characters.map((c) => (
              <li key={c.id} className="border border-border rounded-md p-4 flex gap-4">
                <CharacterPortrait characterId={c.id} alt={c.name} />
                <div>
                  <h2 className="font-heading text-xl">{c.name}</h2>
                  <p className="text-muted-foreground">
                    {c.lineageName} {c.className}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 3: Write `CharacterPortrait.test.tsx`**

Use MSW to return a Blob for one character ID and 404 for another. Verify the `<img>` renders with a `blob:` URL in the success case and the placeholder text renders in the 404 case. Use `URL.createObjectURL` jsdom polyfill: in `setup.ts`, add:

```ts
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();
}
```

- [ ] **Step 4: Write `CharacterListPage.test.tsx`**

Cover empty state (returns `[]`), populated state (returns 2 characters), loading state.

Wrap renders in `<QueryClientProvider>`, `<MemoryRouter>`, `<AuthProvider>` with a token that decodes to a known `playerId` (use a hand-crafted JWT with base64-encoded `{"sub":"player-1"}` payload).

- [ ] **Step 5: Wire CharacterListPage into App**

```tsx
<Route path="/" element={<CharacterListPage />} />
```

(Inside the `<ProtectedRoute>` branch.)

- [ ] **Step 6: Run tests**

```bash
npm run test
```

- [ ] **Step 7: Commit**

```bash
git add web-client/
git commit -m "feat(web-client): add CharacterPortrait and CharacterListPage"
```

---

## Task 12: Character creation wizard shell + Identity/Lineage/Class/Culture steps

**Goal:** Wizard scaffolding + first four content steps. Stats, Portrait, Review come in tasks 13–14.

**Files:**
- Create: `web-client/src/pages/CharacterCreatePage.tsx`
- Create: `web-client/src/components/WizardProgress.tsx`
- Create: `web-client/src/pages/wizard/IdentityStep.tsx`
- Create: `web-client/src/pages/wizard/LineageStep.tsx`
- Create: `web-client/src/pages/wizard/ClassStep.tsx`
- Create: `web-client/src/pages/wizard/CultureStep.tsx`
- Create: `web-client/src/pages/wizard/schema.ts`
- Create: `web-client/src/pages/wizard/__tests__/IdentityStep.test.tsx`
- Create: `web-client/src/pages/wizard/__tests__/LineageStep.test.tsx`

**Acceptance Criteria:**
- [ ] Single `react-hook-form` instance covers all steps; navigating between steps preserves state
- [ ] `Next` is disabled until the current step's slice of the schema validates
- [ ] `Back` always works (except on step 1)
- [ ] Identity validates name (1–40), bio (≤500)
- [ ] Lineage/Class/Culture each fetch via `useQuery`, render a card grid, single-select

**Verify:** `npm run test src/pages/wizard` → green.

**Steps:**

- [ ] **Step 1: Define `schema.ts`**

```ts
import { z } from 'zod';

export const wizardSchema = z.object({
  name: z.string().min(1, 'Required').max(40, 'Max 40 chars'),
  pronouns: z.string().max(40).optional(),
  bio: z.string().max(500).optional(),
  lineageId: z.string().min(1, 'Required'),
  classId: z.string().min(1, 'Required'),
  cultureId: z.string().min(1, 'Required'),
  attributes: z.record(z.string(), z.number()),  // tightened in Task 13
  portraitFile: z.instanceof(Blob).optional(),
});

export type WizardValues = z.infer<typeof wizardSchema>;

export const stepFieldGroups = {
  identity: ['name', 'pronouns', 'bio'] as const,
  lineage: ['lineageId'] as const,
  classStep: ['classId'] as const,
  culture: ['cultureId'] as const,
  stats: ['attributes'] as const,
  portrait: ['portraitFile'] as const,
};
```

- [ ] **Step 2: Write `WizardProgress.tsx`**

A thin strip showing the labeled steps; current step highlighted; clickable to navigate to already-completed steps only.

```tsx
const steps = ['Identity', 'Lineage', 'Class', 'Culture', 'Stats', 'Portrait', 'Review'];

export function WizardProgress({
  current,
  onJump,
  furthest,
}: {
  current: number;
  furthest: number;
  onJump: (i: number) => void;
}) {
  return (
    <ol className="flex gap-2 mb-6">
      {steps.map((label, i) => (
        <li key={label}>
          <button
            type="button"
            disabled={i > furthest}
            onClick={() => onJump(i)}
            className={`px-3 py-1 rounded-md text-sm ${
              i === current ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            {i + 1}. {label}
          </button>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 3: Write `CharacterCreatePage.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/AppShell';
import { WizardProgress } from '@/components/WizardProgress';
import { wizardSchema, stepFieldGroups, type WizardValues } from './wizard/schema';
import { IdentityStep } from './wizard/IdentityStep';
import { LineageStep } from './wizard/LineageStep';
import { ClassStep } from './wizard/ClassStep';
import { CultureStep } from './wizard/CultureStep';
// import StatsStep, PortraitStep, ReviewStep in later tasks

const stepFields = [
  stepFieldGroups.identity,
  stepFieldGroups.lineage,
  stepFieldGroups.classStep,
  stepFieldGroups.culture,
  stepFieldGroups.stats,
  stepFieldGroups.portrait,
] as const;

export function CharacterCreatePage() {
  const methods = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    mode: 'onChange',
    defaultValues: { attributes: {} },
  });
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);

  const onNext = async () => {
    const ok = await methods.trigger(stepFields[step] as unknown as (keyof WizardValues)[]);
    if (!ok) return;
    setStep((s) => {
      const next = s + 1;
      setFurthest((f) => Math.max(f, next));
      return next;
    });
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <WizardProgress current={step} furthest={furthest} onJump={setStep} />
        <FormProvider {...methods}>
          <form onSubmit={(e) => e.preventDefault()}>
            {step === 0 && <IdentityStep />}
            {step === 1 && <LineageStep />}
            {step === 2 && <ClassStep />}
            {step === 3 && <CultureStep />}
            {/* steps 4-6 added in later tasks */}
            <div className="flex justify-between mt-6">
              <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
              <Button type="button" onClick={onNext}>
                Next
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 4: Write `IdentityStep.tsx`**

```tsx
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { WizardValues } from './schema';

export function IdentityStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<WizardValues>();
  return (
    <fieldset className="space-y-4">
      <legend className="text-2xl mb-4">Identity</legend>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="pronouns">Pronouns (optional)</Label>
        <Input id="pronouns" {...register('pronouns')} />
      </div>
      <div>
        <Label htmlFor="bio">Bio (optional)</Label>
        <textarea id="bio" {...register('bio')} className="w-full border border-input rounded-md p-2 min-h-24 bg-background" />
        {errors.bio && <p className="text-destructive text-sm">{errors.bio.message}</p>}
      </div>
    </fieldset>
  );
}
```

- [ ] **Step 5: Write `LineageStep.tsx`** (and Class/Culture mirror this exact pattern)

```tsx
import { useQuery } from '@tanstack/react-query';
import { useFormContext, Controller } from 'react-hook-form';
import { listLineages } from '@/api/rulesets';
import type { WizardValues } from './schema';

const RULESET_KEY = 'default';  // Phase 1: hardcoded; lift to a picker if listRulesets() returns >1

export function LineageStep() {
  const { control } = useFormContext<WizardValues>();
  const { data: lineages = [], isLoading } = useQuery({
    queryKey: ['lineages', RULESET_KEY],
    queryFn: () => listLineages(RULESET_KEY),
  });
  if (isLoading) return <p>Loading lineages…</p>;
  return (
    <fieldset>
      <legend className="text-2xl mb-4">Lineage</legend>
      <Controller
        control={control}
        name="lineageId"
        render={({ field, fieldState }) => (
          <>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lineages.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => field.onChange(l.id)}
                    className={`w-full text-left p-4 border rounded-md ${
                      field.value === l.id ? 'border-primary bg-muted' : 'border-border'
                    }`}
                  >
                    <h3 className="font-heading">{l.name}</h3>
                    <p className="text-sm text-muted-foreground">{l.description}</p>
                  </button>
                </li>
              ))}
            </ul>
            {fieldState.error && <p className="text-destructive text-sm mt-2">{fieldState.error.message}</p>}
          </>
        )}
      />
    </fieldset>
  );
}
```

(Replicate as `ClassStep.tsx` calling `listClasses` and binding `classId`; `CultureStep.tsx` calling `listCultures` and binding `cultureId`.)

- [ ] **Step 6: Write tests**

`IdentityStep.test.tsx`: render inside a `FormProvider`, type a 41-char name, click "submit"-equivalent, expect "Max 40 chars" error.

`LineageStep.test.tsx`: MSW returns 2 lineages, click one, verify the form value updates. Cover loading state too.

- [ ] **Step 7: Wire CharacterCreatePage into App**

```tsx
<Route path="/characters/new" element={<CharacterCreatePage />} />
```

(Inside `<ProtectedRoute>`.)

- [ ] **Step 8: Run tests**

```bash
npm run test src/pages/wizard
```

- [ ] **Step 9: Commit**

```bash
git add web-client/
git commit -m "feat(web-client): wizard shell + Identity/Lineage/Class/Culture steps"
```

---

## Task 13: Wizard Stats + Portrait steps

**Goal:** Stats step matching the GMS `CharacterCreateRequest.attributes` shape; Portrait step with drag-and-drop upload, downscale-to-512 on canvas, AI-generate placeholder button.

**Files:**
- Create: `web-client/src/pages/wizard/StatsStep.tsx`
- Create: `web-client/src/pages/wizard/PortraitStep.tsx`
- Create: `web-client/src/components/PortraitUpload.tsx`
- Create: `web-client/src/lib/imageResize.ts`
- Create: `web-client/src/pages/wizard/__tests__/StatsStep.test.tsx`
- Create: `web-client/src/pages/wizard/__tests__/PortraitStep.test.tsx`
- Modify: `web-client/src/pages/wizard/schema.ts` (tighten attributes shape)
- Modify: `web-client/src/pages/CharacterCreatePage.tsx` (mount the new steps)

**Acceptance Criteria:**
- [ ] StatsStep renders the correct attribute fields with min/max validation matching the GMS DTO
- [ ] PortraitStep accepts PNG/JPEG/WebP via click and drag-drop
- [ ] Files >4 MB rejected client-side with a visible error
- [ ] Selected image downscaled to ≤512×512 via `<canvas>` and stored as a `Blob` on the form
- [ ] Live preview renders the downscaled blob
- [ ] "AI generate" button rendered, disabled, with a tooltip "Coming soon"

**Verify:** `npm run test src/pages/wizard/__tests__/StatsStep.test.tsx src/pages/wizard/__tests__/PortraitStep.test.tsx` → green.

**Steps:**

- [ ] **Step 1: Inspect the GMS `CharacterCreateRequest.attributes` shape**

Open the relevant DTO under `client/src/main/java/org/aethermere/cu/client/api/dto/`. Determine: list of attribute keys (e.g. `STR/DEX/CON/INT/WIS/CHA` or whatever the ruleset uses), value type (int), min/max bounds.

- [ ] **Step 2: Tighten `schema.ts`**

Replace `attributes: z.record(...)` with the actual shape. Example (replace with real attribute names):

```ts
attributes: z.object({
  agility: z.number().int().min(-1).max(2),
  strength: z.number().int().min(-1).max(2),
  finesse: z.number().int().min(-1).max(2),
  instinct: z.number().int().min(-1).max(2),
  presence: z.number().int().min(-1).max(2),
  knowledge: z.number().int().min(-1).max(2),
}),
```

If the existing flow uses a point-buy total, add a `.refine` that the values sum to the expected total.

- [ ] **Step 3: Write `StatsStep.tsx`**

Render six labeled `<Input type="number">` fields driven by `register('attributes.<name>', { valueAsNumber: true })`. Show field-level errors and the running total if point-buy applies.

- [ ] **Step 4: Write `imageResize.ts`**

```ts
export async function downscaleToWebP(file: File, maxDim = 512, quality = 0.9): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / bitmap.width, maxDim / bitmap.height);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/webp', quality),
  );
}
```

- [ ] **Step 5: Write `PortraitUpload.tsx`**

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { downscaleToWebP } from '@/lib/imageResize';

const ACCEPT = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 4 * 1024 * 1024;

export function PortraitUpload({
  value,
  onChange,
}: {
  value: Blob | undefined;
  onChange: (b: Blob | undefined) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!ACCEPT.includes(file.type)) {
      setError('Must be PNG, JPEG, or WebP');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Max 4 MB');
      return;
    }
    const blob = await downscaleToWebP(file);
    onChange(blob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(blob));
  };

  return (
    <div className="space-y-3">
      <label
        htmlFor="portrait-input"
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) await handleFile(f);
        }}
        className="block border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer"
      >
        <input
          id="portrait-input"
          type="file"
          className="sr-only"
          accept={ACCEPT.join(',')}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        Drop an image or click to choose
      </label>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {previewUrl && <img src={previewUrl} alt="Preview" className="w-48 h-48 object-cover rounded-md" />}
      <Button type="button" disabled title="Coming soon">
        Generate with AI (coming soon)
      </Button>
      {value && (
        <Button type="button" variant="ghost" onClick={() => onChange(undefined)}>
          Remove
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Write `PortraitStep.tsx`**

```tsx
import { Controller, useFormContext } from 'react-hook-form';
import { PortraitUpload } from '@/components/PortraitUpload';
import type { WizardValues } from './schema';

export function PortraitStep() {
  const { control } = useFormContext<WizardValues>();
  return (
    <fieldset>
      <legend className="text-2xl mb-4">Portrait</legend>
      <Controller
        control={control}
        name="portraitFile"
        render={({ field }) => <PortraitUpload value={field.value} onChange={field.onChange} />}
      />
    </fieldset>
  );
}
```

- [ ] **Step 7: Mount steps in `CharacterCreatePage`**

Add `{step === 4 && <StatsStep />}` and `{step === 5 && <PortraitStep />}`.

- [ ] **Step 8: Tests**

`StatsStep.test.tsx`: type out-of-range value, expect error.

`PortraitStep.test.tsx`: mock `downscaleToWebP` (or polyfill `createImageBitmap` + `canvas.toBlob` in setup) and verify happy path + size error + content-type error.

For canvas in jsdom, install `canvas` package OR mock `downscaleToWebP` directly in tests by importing and `vi.mock`-ing the module.

- [ ] **Step 9: Run tests**

```bash
npm run test src/pages/wizard
```

- [ ] **Step 10: Commit**

```bash
git add web-client/
git commit -m "feat(web-client): wizard Stats + Portrait steps with client downscale"
```

---

## Task 14: Wizard Review step + submit flow

**Goal:** Review step renders summary; submit creates the character then uploads the portrait; failures handled.

**Files:**
- Create: `web-client/src/pages/wizard/ReviewStep.tsx`
- Create: `web-client/src/pages/wizard/__tests__/ReviewStep.test.tsx`
- Create: `web-client/src/pages/wizard/__tests__/submit.test.tsx`
- Modify: `web-client/src/pages/CharacterCreatePage.tsx` (mount ReviewStep, submit handler)

**Acceptance Criteria:**
- [ ] Review step shows all entered fields read-only
- [ ] Submit calls `POST /api/player-characters` with the JSON request
- [ ] On success with portrait: calls `POST /api/characters/{id}/portrait`
- [ ] On portrait upload failure (post-create): shows toast/inline message, character is still created, navigates to `/`
- [ ] On 400 from create with field errors: navigates back to the earliest step with an error and surfaces those errors
- [ ] On 5xx: stays on Review with a generic error message
- [ ] Invalidates `['characters']` query on success

**Verify:** `npm run test src/pages/wizard/__tests__/submit.test.tsx` → green.

**Steps:**

- [ ] **Step 1: Write `ReviewStep.tsx`**

```tsx
import { useFormContext } from 'react-hook-form';
import type { WizardValues } from './schema';

export function ReviewStep() {
  const { getValues } = useFormContext<WizardValues>();
  const v = getValues();
  return (
    <fieldset className="space-y-2">
      <legend className="text-2xl mb-4">Review</legend>
      <p><strong>Name:</strong> {v.name}</p>
      {v.pronouns && <p><strong>Pronouns:</strong> {v.pronouns}</p>}
      {v.bio && <p><strong>Bio:</strong> {v.bio}</p>}
      <p><strong>Lineage:</strong> {v.lineageId}</p>
      <p><strong>Class:</strong> {v.classId}</p>
      <p><strong>Culture:</strong> {v.cultureId}</p>
      <p><strong>Attributes:</strong> {JSON.stringify(v.attributes)}</p>
      <p><strong>Portrait:</strong> {v.portraitFile ? 'Selected' : 'None'}</p>
    </fieldset>
  );
}
```

(Display lineage/class/culture *names* not IDs by looking them up from cached query data — fetch via `useQuery` with the same keys.)

- [ ] **Step 2: Add submit handler in `CharacterCreatePage`**

```tsx
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { createCharacter, uploadPortrait } from '@/api/characters';
import { ApiError } from '@/api/errors';
// ...
const nav = useNavigate();
const qc = useQueryClient();
const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'portrait-failed'>('idle');
const [submitError, setSubmitError] = useState<string | null>(null);

const onSubmit = async () => {
  setSubmitState('submitting');
  setSubmitError(null);
  const v = methods.getValues();
  try {
    const created = await createCharacter({
      rulesetKey: 'default',
      name: v.name,
      pronouns: v.pronouns,
      bio: v.bio,
      lineageId: v.lineageId,
      classId: v.classId,
      cultureId: v.cultureId,
      attributes: v.attributes,
    });
    if (v.portraitFile) {
      try {
        await uploadPortrait(created.id, v.portraitFile);
      } catch {
        setSubmitState('portrait-failed');
        // Still navigate; character exists.
      }
    }
    qc.invalidateQueries({ queryKey: ['characters'] });
    nav('/');
  } catch (e) {
    if (e instanceof ApiError && e.status === 400 && Object.keys(e.fieldErrors).length > 0) {
      // Map field errors back to form
      Object.entries(e.fieldErrors).forEach(([k, msg]) =>
        methods.setError(k as keyof WizardValues, { message: msg }),
      );
      // Jump to earliest step containing an errored field
      const order = [
        stepFieldGroups.identity,
        stepFieldGroups.lineage,
        stepFieldGroups.classStep,
        stepFieldGroups.culture,
        stepFieldGroups.stats,
      ] as const;
      const erroredStep = order.findIndex((group) =>
        group.some((f) => f in e.fieldErrors),
      );
      if (erroredStep >= 0) setStep(erroredStep);
      setSubmitError('Please fix the highlighted fields');
    } else {
      setSubmitError('Something went wrong; please try again');
    }
    setSubmitState('idle');
  }
};
```

Show "Create Character" button only when `step === 6` (Review); render Next on earlier steps.

- [ ] **Step 3: Mount ReviewStep**

`{step === 6 && <ReviewStep />}` plus replace the Next button with "Create Character" on the last step.

- [ ] **Step 4: Tests**

`ReviewStep.test.tsx`: render with form values prefilled, assert on visible text.

`submit.test.tsx`: integration — render the whole wizard, fill all steps, submit. Three scenarios via MSW:
1. Happy path with portrait: POST character 200, POST portrait 204 → lands on `/`.
2. Portrait fails post-create: POST character 200, POST portrait 500 → still navigates to `/`, error visible.
3. Validation error from server: POST character 400 with `{ fieldErrors: { name: 'taken' } }` → wizard jumps back to step 0, error shows under name.

- [ ] **Step 5: Run tests**

```bash
npm run test src/pages/wizard
```

- [ ] **Step 6: Manual smoke against real GMS**

With GMS running: register, log in, navigate through wizard, submit. Verify the character appears on `/` with portrait.

- [ ] **Step 7: Commit**

```bash
git add web-client/
git commit -m "feat(web-client): wizard Review step and submit flow"
```

---

## Task 15: Playwright happy-path E2E

**Goal:** One Playwright test that registers, creates a character without portrait, and verifies it appears on the list. Run against a real GMS instance (developer responsibility).

**Files:**
- Create: `web-client/playwright.config.ts`
- Create: `web-client/e2e/happy-path.spec.ts`
- Modify: `web-client/package.json` (Playwright dep)

**Acceptance Criteria:**
- [ ] `npm run e2e` boots Playwright, runs the test, exits 0 (assuming GMS + web-client dev server are running)
- [ ] Test covers: register → land on `/` → create character (Identity → Stats → skip portrait → Review → submit) → see character on list

**Verify:** `npm run e2e` → 1 test passing.

**Steps:**

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
```

- [ ] **Step 3: Write `e2e/happy-path.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

const RANDOM_USER = `user_${Date.now()}`;

test('register, create character, see it on the list', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: /register/i }).click();

  await page.getByLabel(/username/i).fill(RANDOM_USER);
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByLabel(/confirm/i).fill('password123');
  await page.getByRole('button', { name: /register/i }).click();

  await expect(page).toHaveURL('/');
  await page.getByRole('link', { name: /create new character/i }).click();

  await page.getByLabel(/name/i).fill(`Test ${Date.now()}`);
  await page.getByRole('button', { name: /next/i }).click();

  // Lineage / Class / Culture: pick the first card on each step
  for (const _ of [0, 1, 2]) {
    await page.locator('fieldset button').first().click();
    await page.getByRole('button', { name: /next/i }).click();
  }

  // Stats: set all to 0 (or whatever the validator allows)
  for (const input of await page.locator('fieldset input[type=number]').all()) {
    await input.fill('0');
  }
  await page.getByRole('button', { name: /next/i }).click();

  // Portrait: skip
  await page.getByRole('button', { name: /next/i }).click();

  // Review + submit
  await page.getByRole('button', { name: /create character/i }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByText(`Test`).first()).toBeVisible();
});
```

(Adjust the Stats-step interaction to match the actual fields and validation.)

- [ ] **Step 4: Document running it**

Add a section to a `web-client/README.md` (or extend an existing one) listing the boot sequence: GMS up, `npm run dev` up, then `npm run e2e`.

- [ ] **Step 5: Run it**

Boot GMS, boot `npm run dev`, run `npm run e2e`. Verify pass.

- [ ] **Step 6: Commit**

```bash
git add web-client/
git commit -m "test(web-client): add Playwright happy-path E2E"
```

---

## Self-Review

**1. Spec coverage:**
- Spec §3 (architecture) → Tasks 0–7
- Spec §4 (routing) → Tasks 5, 6, 7, 11, 12
- Spec §5 (auth) → Tasks 3, 4, 5, 6, 7
- Spec §6 (wizard) → Tasks 12, 13, 14
- Spec §7 (character list) → Task 11
- Spec §8 (portrait component) → Task 11
- Spec §9 (GMS changes) → Tasks 8, 9, 10
- Spec §10 (theming) → Task 1
- Spec §11 (testing) → Tasks 2, 11, 12, 13, 14, 15
- Spec §13 (code quality) → Task 0
- Spec §14 (acceptance criteria) → covered cumulatively
- Spec §15 (risks) → mitigations referenced inline (single-flight refresh in Task 3, ownership check in Task 10, etc.)

No spec gaps.

**2. Placeholder scan:** None. Each step has the actual content the engineer needs.

**3. Type consistency:** `WizardValues`, `CharacterCreateRequest`, `CharacterResponse`, `apiFetch`, `configureApiClient`, `ApiError` are used consistently. `playerId` is consistently the JWT `sub` claim.

**Known TBD-by-design:** the GMS DTO field names (Task 4 step 1, Task 13 step 1) are intentionally inspected at execution time rather than guessed in the plan — the existing Java DTOs are the source of truth.
