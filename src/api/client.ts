/**
 * Typed fetch wrapper around the API.
 *
 * Every request carries the access token. If the access token has expired the
 * server answers 401, so a single retry is made after exchanging the stored
 * refresh token for a new pair. Concurrent requests that all hit 401 share one
 * refresh call rather than each rotating the token independently (which would
 * invalidate each other).
 */

import type { AuthSession, TokenPair } from './types'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1'

const ACCESS_KEY = 'church-finance.access'
const REFRESH_KEY = 'church-finance.refresh'

/** An error carrying the server's flattened `detail` message. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function storeTokens(tokens: TokenPair): void {
  localStorage.setItem(ACCESS_KEY, tokens.access_token)
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function hasSession(): boolean {
  return getAccessToken() !== null
}

/** Called when refreshing fails, so the app can show the login screen. */
type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler = () => {}

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Query parameters; null, undefined and empty values are dropped. */
  query?: object
  /** Set for the auth calls that must not trigger a refresh loop. */
  anonymous?: boolean
  signal?: AbortSignal
}

function buildUrl(path: string, query?: object): string {
  const url = `${BASE_URL}${path}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

function errorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail
    if (typeof detail === 'string') return detail
    // FastAPI's default shape for unhandled errors.
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item) =>
          item && typeof item === 'object' && 'msg' in item
            ? String((item as { msg: unknown }).msg).replace(/^Value error, /, '')
            : 'Invalid value.',
        )
        .join(' ')
    }
  }
  return fallback
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

/** In-flight refresh, so parallel 401s only rotate the token once. */
let refreshInFlight: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  refreshInFlight ??= (async () => {
    try {
      const response = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!response.ok) return false
      const session = (await parseBody(response)) as AuthSession
      storeTokens(session.tokens)
      return true
    } catch {
      return false
    } finally {
      // Allow the next expiry to trigger a fresh attempt.
      queueMicrotask(() => {
        refreshInFlight = null
      })
    }
  })()

  return refreshInFlight
}

async function send<T>(path: string, options: RequestOptions, retried: boolean): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (!options.anonymous) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  })

  if (response.status === 401 && !options.anonymous && !retried) {
    const refreshed = await refreshAccessToken()
    if (refreshed) return send<T>(path, options, true)
    clearTokens()
    onUnauthorized()
    throw new ApiError(401, 'Your session has expired. Please sign in again.')
  }

  if (!response.ok) {
    const payload = await parseBody(response)
    throw new ApiError(
      response.status,
      errorMessage(payload, `Request failed (${response.status}).`),
    )
  }

  return (await parseBody(response)) as T
}

export const api = {
  get: <T>(path: string, query?: object) => send<T>(path, { query }, false),
  post: <T>(path: string, body?: unknown, query?: object) =>
    send<T>(path, { method: 'POST', body, query }, false),
  patch: <T>(path: string, body?: unknown) => send<T>(path, { method: 'PATCH', body }, false),
  delete: <T>(path: string) => send<T>(path, { method: 'DELETE' }, false),
  anonymous: {
    get: <T>(path: string, query?: object) => send<T>(path, { query, anonymous: true }, false),
    post: <T>(path: string, body?: unknown) =>
      send<T>(path, { method: 'POST', body, anonymous: true }, false),
  },
}

export type ApiClient = typeof api
