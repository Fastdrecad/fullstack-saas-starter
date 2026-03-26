import { useAuthStore } from '../stores/auth.store'

type ApiError = {
  code: string
  message: string
  details?: Array<{ field: string; message: string }>
}

// Track in-flight refresh to prevent concurrent refreshes
let refreshPromise: Promise<boolean> | null = null

const getHeaders = (): HeadersInit => {
  const token = useAuthStore.getState().accessToken
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

const parseError = async (res: Response): Promise<ApiError> => {
  try {
    const json = await res.json()
    return json.error
  } catch {
    return { code: 'UNKNOWN', message: res.statusText }
  }
}

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (res.status === 204) return undefined as T
  const json = await res.json()
  return json.data
}

const attemptRefresh = async (): Promise<boolean> => {
  // If a refresh is already in flight, wait for it
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })

      if (!res.ok) return false

      const json = await res.json()
      const { accessToken, user } = json.data
      useAuthStore.getState().setAuth(accessToken, user)
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

const fetchWithAuth = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const res = await fetch(path, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers as Record<string, string>) },
    credentials: 'include',
  })

  // If 401, try to refresh and retry once
  if (res.status === 401 && !path.includes('/auth/refresh')) {
    const refreshed = await attemptRefresh()

    if (refreshed) {
      return fetch(path, {
        ...options,
        headers: { ...getHeaders(), ...(options.headers as Record<string, string>) },
        credentials: 'include',
      })
    }

    // Refresh failed — clear auth and let the error propagate
    useAuthStore.getState().clearAuth()
  }

  return res
}

export const api = {
  get: async <T>(path: string): Promise<T> => {
    const res = await fetchWithAuth(path)
    if (!res.ok) throw await parseError(res)
    return handleResponse<T>(res)
  },
  post: async <T>(path: string, body?: unknown): Promise<T> => {
    const res = await fetchWithAuth(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw await parseError(res)
    return handleResponse<T>(res)
  },
  delete: async <T>(path: string): Promise<T> => {
    const res = await fetchWithAuth(path, { method: 'DELETE' })
    if (!res.ok) throw await parseError(res)
    return handleResponse<T>(res)
  },
}

/**
 * Try to restore session on app load.
 * Calls POST /auth/refresh — if user has a valid refresh cookie, they get logged in.
 */
export const initAuth = async () => {
  const { setLoading, clearAuth } = useAuthStore.getState()
  setLoading(true)

  const success = await attemptRefresh()
  if (!success) {
    clearAuth()
  }
}

export type { ApiError }
