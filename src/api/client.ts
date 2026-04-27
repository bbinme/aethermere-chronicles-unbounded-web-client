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
        const body = (await res.json()) as { accessToken: string };
        const token = body.accessToken;
        setToken(token);
        return token;
      } catch {
        return null;
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
      ...(body !== undefined && !(body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    body:
      body instanceof FormData
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
  };

  let res = await fetch(`${BASE_URL}${path}`, init);

  if (res.status === 401 && !noRefresh) {
    const newToken = await refreshToken();
    if (newToken) {
      const retryInit: RequestInit = {
        ...init,
        headers: {
          ...(init.headers ?? {}),
          Authorization: `Bearer ${newToken}`,
        },
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
      const errBody = (await res.json()) as {
        code?: string;
        message?: string;
        fieldErrors?: FieldErrors;
      };
      if (errBody.fieldErrors) Object.assign(fieldErrors, errBody.fieldErrors);
      code = errBody.code;
      if (errBody.message) message = errBody.message;
    } catch {
      // ignore JSON parse failure
    }
    throw new ApiError(res.status, code, fieldErrors, message);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
