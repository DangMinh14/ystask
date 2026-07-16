/**
 * Minimal fetch wrapper for the Ystask API.
 * - Prefixes /api, attaches the Bearer token
 * - On 401: tries a single refresh-token rotation, then retries the request
 * - Normalizes RFC 7807 ProblemDetails errors into ApiError
 */

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type TokenPair = { accessToken: string; refreshToken: string }

const STORAGE_KEY = 'ystask-auth'

export function loadTokens(): TokenPair | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as TokenPair) : null
  } catch {
    return null
  }
}

export function saveTokens(tokens: TokenPair | null) {
  try {
    if (tokens) localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore storage errors */
  }
}

/** Called when refresh fails — set by the auth store to force logout. */
let onSessionExpired: (() => void) | null = null
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler
}

let refreshPromise: Promise<boolean> | null = null

async function refreshTokens(): Promise<boolean> {
  // Deduplicate concurrent refresh attempts.
  refreshPromise ??= (async () => {
    const tokens = loadTokens()
    if (!tokens?.refreshToken) return false
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      })
      if (!res.ok) return false
      const data = await res.json()
      saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

async function request<T>(method: string, url: string, body?: unknown, retried = false): Promise<T> {
  const tokens = loadTokens()
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`

  let res: Response
  try {
    res = await fetch(`/api${url}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.')
  }

  if (res.status === 401 && !retried && loadTokens()?.refreshToken) {
    const refreshed = await refreshTokens()
    if (refreshed) return request<T>(method, url, body, true)
    saveTokens(null)
    onSessionExpired?.()
    throw new ApiError(401, 'Your session has expired. Please sign in again.')
  }

  if (!res.ok) {
    let message = 'Something went wrong. Please try again.'
    try {
      const problem = await res.json()
      // Business failures use { error }; DataAnnotations validation returns
      // ProblemDetails with an errors{} map.
      if (typeof problem?.error === 'string') {
        message = problem.error
      } else if (problem?.errors && typeof problem.errors === 'object') {
        const first = Object.values(problem.errors as Record<string, string[]>)[0]
        if (first?.length) message = first[0]
      } else if (typeof problem?.title === 'string') {
        message = problem.title
      }
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const http = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  delete: <T>(url: string) => request<T>('DELETE', url),
}
