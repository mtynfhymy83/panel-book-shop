import { sessionStore } from './session'
import type { ApiEnvelope, ApiFailure, AuthSession, BestSeller, BestSellerPayload } from './types'

const API_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 0,
    public readonly code = 'API_ERROR',
    public readonly fields: Record<string, string | string[]> = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
  retry?: boolean
}

let refreshRequest: Promise<boolean> | null = null

function requestId() {
  return `admin-${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
}

async function parse(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined
  return response.json().catch(() => undefined)
}

function failure(response: Response, payload: unknown) {
  const envelope = payload as ApiFailure | undefined
  return new ApiError(
    envelope?.error?.message || (response.status === 403 ? 'دسترسی مدیریت برای این حساب فعال نیست.' : 'ارتباط با سرور انجام نشد.'),
    response.status,
    envelope?.error?.code || `HTTP_${response.status}`,
    envelope?.error?.fields || {},
  )
}

async function refreshTokens() {
  const refreshToken = sessionStore.getRefreshToken()
  if (!refreshToken) return false
  const response = await fetch(`${API_URL}/auth/token/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId() },
    body: JSON.stringify({ refreshToken }),
  })
  const payload = await parse(response) as ApiEnvelope<Pick<AuthSession, 'accessToken' | 'refreshToken'>> | undefined
  if (!response.ok || !payload?.data) {
    sessionStore.clear()
    return false
  }
  sessionStore.updateTokens(payload.data)
  return true
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', 'X-Request-Id': requestId() }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.auth !== false) {
    const token = sessionStore.getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const payload = await parse(response)

  if (response.status === 401 && options.auth !== false && options.retry !== false) {
    refreshRequest ||= refreshTokens().finally(() => { refreshRequest = null })
    if (await refreshRequest) return request<T>(path, { ...options, retry: false })
  }
  if (!response.ok) throw failure(response, payload)
  if (response.status === 204) return undefined as T
  const envelope = payload as ApiEnvelope<T>
  return envelope.data
}

export const authApi = {
  login: (username: string, password: string) => request<AuthSession>('/auth/admin/login', { method: 'POST', body: { username, password }, auth: false }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
}

export const bestSellersApi = {
  list: (query = '') => request<BestSeller[]>(`/admin/best-selling-products${query ? `?q=${encodeURIComponent(query)}` : ''}`),
  create: (data: BestSellerPayload) => request<BestSeller>('/admin/best-selling-products', { method: 'POST', body: data }),
  update: (id: string, data: BestSellerPayload) => request<BestSeller>(`/admin/best-selling-products/${encodeURIComponent(id)}`, { method: 'PATCH', body: data }),
  remove: (id: string) => request<void>(`/admin/best-selling-products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
