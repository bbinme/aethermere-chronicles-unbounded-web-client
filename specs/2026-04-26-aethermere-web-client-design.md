# Aethermere Web Client — Phase 1 Design

**Date:** 2026-04-26
**Scope:** Replace the Swing pre-game flow (auth + character creation) with a web-based client. Party lobby, overworld, and combat are out of scope and will be addressed in subsequent specs.

## 1. Goals

- Build a standalone web SPA that replaces the existing Swing client's auth and character-creation screens.
- Match the Swing client's dark-fantasy visual identity with a lighter touch (Cinzel/Raleway, dark palette, no ornate frames).
- Talk directly to the existing GMS (Spring Boot, `localhost:8080`) — no new backend layer.
- Establish patterns (auth, API client, theming, forms) that scale to later phases without rework.

## 2. Out of scope

- Party lobby (deferred — needs new GMS endpoints; will get its own spec).
- Overworld hex map, combat, dungeons.
- AI-generated portraits — a placeholder slot is included in the UI, but generation is deferred.
- S3 / cloud storage, image CDN, content moderation.
- Production deployment specifics (Nginx config, hosting choice). The build must produce a static `dist/`; deployment is a downstream task.

## 3. Architecture

### 3.1 Stack

- **Vite + React 18 + TypeScript** SPA.
- **Tailwind CSS** + **shadcn/ui** components (Radix primitives, owned source).
- **React Router** for routing.
- **TanStack Query** for server state and caching.
- **React Hook Form + Zod** for forms and validation.
- **Vitest + React Testing Library** for unit tests.
- **MSW** (Mock Service Worker) for API mocking in tests.
- **Playwright** for one E2E happy-path test.

### 3.2 Topology

```
Browser (web-client SPA)
   |
   |  fetch(...) with Authorization: Bearer <jwt>
   |  fetch(...) with credentials: 'include' for refresh cookie
   v
GMS Spring Boot (localhost:8080)
   - CORS allow http://localhost:5173 with allowCredentials = true
   - Existing endpoints: /api/auth/{register,login,refresh,logout},
     /api/player-characters, /api/characters, /api/rulesets/...
   - NEW endpoints: /api/characters/{id}/portrait (POST + GET)
```

### 3.3 Project location

Sibling of the Swing client inside the existing monorepo:

```
aethermere-chronicles-unbounded/
  client/         (existing Swing — untouched)
  web-client/     (NEW)
  docs/superpowers/specs/   (this spec lives here)
```

### 3.4 Project shape

```
web-client/
  index.html
  package.json
  vite.config.ts
  tailwind.config.ts
  tsconfig.json
  .env.development          (VITE_GMS_URL=http://localhost:8080)
  .env.production           (VITE_GMS_URL=__configurable__)
  public/
    fonts/                  (Cinzel-*.woff2, Raleway-*.woff2)
  src/
    main.tsx
    App.tsx                 (router root + AuthProvider + QueryClientProvider)
    api/
      client.ts             (apiFetch wrapper: auth header, refresh-on-401)
      auth.ts               (login/register/refresh/logout)
      characters.ts         (createCharacter, listCharacters, uploadPortrait, fetchPortraitBlob)
      rulesets.ts           (listRulesets/lineages/classes/cultures)
      types.ts              (shared response types mirrored from GMS DTOs)
    auth/
      AuthContext.tsx
      useAuth.ts
      ProtectedRoute.tsx
    pages/
      LoginPage.tsx
      RegisterPage.tsx
      CharacterListPage.tsx
      CharacterCreatePage.tsx
    components/
      ui/                   (shadcn-generated primitives)
      AppShell.tsx          (header with logo + logout)
      PortraitUpload.tsx
      CharacterPortrait.tsx (fetch-then-blob image component)
      WizardProgress.tsx
    theme/
      globals.css           (Tailwind base + @font-face for Cinzel/Raleway)
      tokens.ts             (color/spacing tokens echoing aethermoor-design-spec.docx)
    test/
      setup.ts              (Vitest + RTL config)
      msw/handlers.ts       (mock GMS responses)
```

## 4. Routing

| Path             | Component             | Auth      | Notes                                     |
| ---------------- | --------------------- | --------- | ----------------------------------------- |
| `/login`         | `LoginPage`           | public    | Redirects to `/` if already authenticated |
| `/register`      | `RegisterPage`        | public    | Auto-login on success, then `/`           |
| `/`              | `CharacterListPage`   | protected | Landing page; lists user's characters     |
| `/characters/new`| `CharacterCreatePage` | protected | Multi-step wizard                         |
| `*`              | redirect              | —         | To `/` if authed, `/login` if not         |

`ProtectedRoute` calls `POST /api/auth/refresh` on mount if no in-memory token exists. Success → render the route; failure → redirect to `/login`. This makes "refresh the tab while logged in" work.

## 5. Authentication

### 5.1 Token strategy

- **Access token (JWT):** held in memory only via `AuthContext`. Lost on tab refresh; recovered via `/api/auth/refresh` (which uses the cookie).
- **Refresh token:** HttpOnly cookie set by GMS on login. Browser sends it automatically with `credentials: 'include'`.
- **No localStorage / sessionStorage for tokens** — eliminates XSS-stealable token surface.
- **`playerId`:** decoded from the JWT `sub` claim, mirroring the Swing client's `getPlayerId()`.

### 5.2 API client (`src/api/client.ts`)

`apiFetch(path, opts)` wraps `fetch` and handles:

1. Prepends `import.meta.env.VITE_GMS_URL`.
2. Sets `Authorization: Bearer <accessToken>` if `AuthContext` has one.
3. Sets `credentials: 'include'` so the refresh cookie travels.
4. **Refresh-on-401:** on a 401 response, calls `POST /api/auth/refresh`. If refresh succeeds → updates the in-memory token and retries the original request once. If refresh fails → fires an `auth-expired` event; `AuthContext` clears state and triggers a redirect to `/login`.
5. **Single-flight refresh:** concurrent 401s share one in-flight refresh promise (otherwise N requests trigger N refresh calls and rotate refresh tokens unnecessarily).
6. Throws a typed `ApiError` with `{ status, code, fieldErrors }` for forms and React Query to react to.

### 5.3 Auth flows

- **Register** → `POST /api/auth/register` → on success, immediately call login with the same credentials → store access token → navigate to `/`.
- **Login** → `POST /api/auth/login` → store access token → navigate to `/`.
- **App boot** → `App.tsx` calls `refresh()` once on mount. Success → user is logged in. Failure → user is a guest; `ProtectedRoute` will send them to `/login`.
- **Logout** → `POST /api/auth/logout` → clear in-memory token → navigate to `/login`.

## 6. Character creation wizard

Multi-step form, single `react-hook-form` instance with a Zod schema covering all steps. Steps don't unmount fields. "Next" is disabled until the current step's slice validates. "Back" always works.

### 6.1 Steps

1. **Identity** — name (1–40 chars, required), pronouns (free text, optional), short bio (≤500 chars, optional).
2. **Lineage** — `useQuery(['lineages', rulesetKey], listLineages)`. Card grid, single-select. Card: name + 1-line flavor + key stat hints.
3. **Class** — same pattern with `listClasses`. Card: name + role + 1-line summary.
4. **Culture** — same pattern with `listCultures`.
5. **Stats** — mirrors the existing Swing client's stat-assignment rules so server validation stays identical. If the existing flow uses point-buy, render labeled number inputs with min/max validation matching the GMS `CharacterCreateRequest` contract.
6. **Portrait** — drag-and-drop or click-to-pick image upload. Accept `image/png, image/jpeg, image/webp`. Client-side: max 4 MB pre-resize, downscale to 512×512 max via `<canvas>` before holding in memory. Live preview. **"AI generate" button is rendered but disabled with a "Coming soon" tooltip** — this is the placeholder for future AI integration.
7. **Review** — read-only summary of all fields + "Create Character" button.

### 6.2 Submit flow

On "Create Character":

1. `POST /api/player-characters` with the JSON `CharacterCreateRequest` (no portrait).
2. On success, if a portrait was selected: `POST /api/characters/{id}/portrait` (multipart) using the returned character ID.
3. Invalidate the `['characters']` query.
4. Navigate to `/`.

If portrait upload fails after character creation, the character is still created — show a toast and offer a "Retry portrait upload" affordance on the character list. The character record persists; the portrait field stays null.

### 6.3 Error handling

- 4xx with field errors → mapped via `react-hook-form`'s `setError` into the relevant step's fields; the wizard jumps to the earliest step with an error.
- 5xx → toast "Something went wrong; please try again" and stay on the review step.
- Network failure → same as 5xx.

### 6.4 Ruleset selection

Phase 1 hardcodes the default ruleset (matching the Swing client's default). If `listRulesets()` returns more than one, render a small dropdown above step 1; otherwise no dropdown is shown. A real ruleset picker is deferred.

## 7. Character list page

- `useQuery(['characters', playerId], listCharacters)` — fetches characters for the current player.
- Grid of `<CharacterCard>` (portrait thumbnail + name + class + lineage + delete affordance).
- "Create New Character" button → `/characters/new`.
- Empty state: "You haven't created any characters yet" + the same button.
- Logout button in `AppShell` header.

## 8. Portrait component

`<CharacterPortrait characterId={id} alt={name} />` handles the fact that `<img src>` does not send `Authorization` headers:

1. On mount, `fetch('/api/characters/{id}/portrait', { auth })` via `apiFetch`.
2. If response is 200 → `URL.createObjectURL(blob)` → set as `<img src>`.
3. If response is 404 → render the silhouette placeholder.
4. On unmount, `URL.revokeObjectURL` to free memory.
5. Cache via TanStack Query keyed by character ID + `last-modified` header so repeated renders (list page) don't re-fetch.

This keeps the auth model uniform (Bearer everywhere) at the cost of a few extra lines per portrait.

## 9. GMS-side changes required

These changes live in the **GMS repo** (`aethermere-chronicles-unbounded-gms`), not `web-client/`. They are dependencies of this spec; whether they are implemented in the same plan or split into a parallel plan is a downstream decision.

### 9.1 CORS

Add or update a `WebMvcConfigurer` to allow:

- **Origins:** `http://localhost:5173` (Vite dev) plus a configurable production origin via property `aethermere.web.origin`.
- **Methods:** `GET, POST, PUT, DELETE, OPTIONS`.
- **Headers:** `Authorization, Content-Type, X-Requested-With`.
- **`allowCredentials = true`** (required for the refresh cookie).
- **Path:** `/api/**` and `/sessions`.

### 9.2 Portrait upload + retrieval

```
POST /api/characters/{characterId}/portrait
   Auth: Bearer
   Content-Type: multipart/form-data
   Body: file=<image/png|jpeg|webp>, max 4 MB
   Behavior:
     - Validate ownership (the character belongs to the JWT's playerId)
     - Re-encode to WebP, downscale to 512x512 max
     - Write to ${aethermere.gms.data-dir}/portraits/{characterId}.webp
     - Update character entity's portrait_uri = "characters/{id}/portrait"
   Returns: 204 No Content
   Errors: 401 unauth, 403 not your character, 413 too large, 415 wrong type

GET /api/characters/{characterId}/portrait
   Auth: Bearer
   Returns: 200 image/webp bytes, Cache-Control: private, max-age=300
   Errors: 401, 403, 404 if no portrait set
```

### 9.3 Storage

- Files written to `${aethermere.gms.data-dir}/portraits/`. Reuse the existing `aethermere.gms.data-dir` property if one exists; otherwise add it.
- Directory created on application startup if missing.
- Files are not checked into git.

### 9.4 Schema migration

- Add nullable column `portrait_uri VARCHAR(255)` to the character table via Flyway/Liquibase migration, matching whichever migration tool the GMS repo already uses.

## 10. Theming

- **Fonts:** Cinzel (headings) and Raleway (body) loaded as WOFF2 from `public/fonts/` via `@font-face` in `theme/globals.css`. Same files as the Swing client uses, copied into `public/fonts/`.
- **Color tokens:** echo the palette in `client/specs/pre-design/aethermoor-design-spec.docx` — dark backgrounds, parchment/gold accents — but skip ornate borders, parchment textures, and decorative SVGs in Phase 1. Tokens defined in `theme/tokens.ts` and wired into `tailwind.config.ts`.
- **Components:** shadcn primitives are themed via Tailwind classes; no custom CSS files per component.

## 11. Testing

### 11.1 Unit / component tests (Vitest + RTL)

Required coverage:

- `useAuth` — login, logout, refresh-on-mount.
- `apiFetch` — auth header injection, refresh-on-401 retry, single-flight refresh under concurrent 401s, `ApiError` shape.
- Zod schemas for each wizard step.
- `WizardProgress` step gating.
- `CharacterPortrait` — fetch-then-blob, 404 fallback, blob URL cleanup on unmount.

### 11.2 API mocking (MSW)

Tests intercept `fetch` via MSW handlers in `src/test/msw/handlers.ts`, exercising the real `apiFetch` against fake GMS responses. No mocking of `apiFetch` itself.

### 11.3 E2E (Playwright)

One happy-path test in Phase 1: register → create character (no portrait) → see it on the list. Runs locally against a real GMS instance (developer responsibility) or against MSW-backed dev. CI integration is deferred.

### 11.4 Out of scope for Phase 1

- Visual regression / snapshot tests (theme will iterate).
- Accessibility audit beyond ESLint `jsx-a11y` defaults.
- Cross-browser matrix beyond "modern Chromium + Firefox."

## 12. Dev workflow

```
# Terminal 1 - GMS
cd aethermere-chronicles-unbounded-gms
./gradlew bootRun

# Terminal 2 - web client
cd aethermere-chronicles-unbounded/web-client
npm run dev
# -> http://localhost:5173
```

Environment variables:

- `VITE_GMS_URL` — GMS base URL. Defaults via `.env.development` to `http://localhost:8080`.

## 13. Code quality

- **ESLint:** `@typescript-eslint`, `react-hooks`, `jsx-a11y`. `npm run lint` clean before merge.
- **Prettier:** project config; `npm run format`.
- **Type check:** `tsc --noEmit` clean before merge.
- **CI script:** `npm run lint && npm run typecheck && npm run test`.
- No husky / pre-commit hooks unless the monorepo already uses them.

## 14. Acceptance criteria

- [ ] Fresh install: `npm install && npm run dev` boots Vite at `http://localhost:5173` with no errors.
- [ ] CORS: web client successfully calls GMS auth endpoints with credentials.
- [ ] Register flow: new email + password creates an account, auto-logs in, lands on `/`.
- [ ] Login flow: existing credentials log in, refresh cookie is set, page refresh keeps the user logged in.
- [ ] Logout flow: clears in-memory token, redirects to `/login`, refresh no longer succeeds.
- [ ] Character list: shows the player's characters with portraits (when set) or silhouette placeholder.
- [ ] Character creation: all 7 wizard steps work, Zod validation gates "Next," server-side validation errors map back to fields.
- [ ] Portrait upload: PNG/JPEG/WebP up to 4 MB, downscaled to 512x512, persisted via `POST /api/characters/{id}/portrait`, retrievable via `GET /api/characters/{id}/portrait`.
- [ ] Portrait failure: character is still created if portrait upload fails post-creation; user sees a "Retry" affordance.
- [ ] Refresh-on-401: an expired access token transparently refreshes and the original request retries (verified by unit test).
- [ ] Single-flight refresh: concurrent 401s share one refresh call (verified by unit test).
- [ ] All unit tests pass (`npm run test`).
- [ ] Type check passes (`tsc --noEmit`).
- [ ] Lint passes (`npm run lint`).
- [ ] Playwright happy-path test passes locally.

## 15. Risks and mitigations

| Risk                                                                              | Mitigation                                                                                        |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| GMS DTOs drift from web-client TypeScript types                                   | Generate types from GMS OpenAPI spec in a follow-up; for now mirror DTOs by hand and pin in tests |
| Refresh cookie not set in dev due to CORS misconfiguration                        | Acceptance test verifies refresh works; document `allowCredentials` requirement                   |
| Portrait endpoint authorization bypass (someone uploads to another's character)   | GMS handler validates the character belongs to JWT `sub` before writing                           |
| Browser cache of stale portraits after re-upload                                  | Cache-bust query param `?v={updatedAt}` on portrait URLs                                          |
| Image-encoding cost on the client (Canvas downscale on a 4 MB JPEG)               | Acceptable in Phase 1; revisit with `createImageBitmap` if measurements show issues               |

## 16. Phase 2 / follow-ups (not part of this spec)

- Party lobby + GMS endpoints + WebSocket/SSE realtime.
- Overworld hex map (Canvas/WebGL).
- Combat screen.
- AI portrait generation (Sana / Flux / SDXL) — design where it runs, prompt scaffolding, content policy, candidate selection UX.
- OpenAPI-driven type generation.
- Production deployment pipeline.
- Migration of portrait storage from disk to S3/CDN if needed.
