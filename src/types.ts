export type ApiEnvelope<T> = { data: T; meta?: { requestId?: string; serverTime?: string } }

export type ApiFailure = {
  error: {
    code?: string
    message?: string
    fields?: Record<string, string | string[]>
    details?: Record<string, unknown>
  }
  meta?: { requestId?: string }
}

export type AdminUser = { id: string; username: string; phone: string; name: string | null }

export type AuthSession = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  sessionExpiresAt: string
  user: AdminUser
}

export type BestSeller = {
  id: string
  title: string
  coverUrl: string
  coverAlt: string | null
  price: number
  discountedPrice: number
  discountPercent: number
  remainingPercent: number
  sortOrder: number
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export type BestSellerPayload = Omit<BestSeller, 'id' | 'createdAt' | 'updatedAt'>
