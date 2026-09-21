import type { AdminUser, AuthSession } from './types'

const ACCESS_KEY = 'pardis_admin_access_token'
const REFRESH_KEY = 'pardis_admin_refresh_token'
const USER_KEY = 'pardis_admin_user'
export const SESSION_EVENT = 'pardis-admin:session-changed'

const get = (storage: Storage, key: string) => {
  try { return storage.getItem(key) } catch { return null }
}

const set = (storage: Storage, key: string, value: string | null) => {
  try {
    if (value === null) storage.removeItem(key)
    else storage.setItem(key, value)
  } catch { /* Storage may be disabled. */ }
}

const notify = () => window.dispatchEvent(new Event(SESSION_EVENT))

export const sessionStore = {
  getAccessToken: () => get(sessionStorage, ACCESS_KEY),
  getRefreshToken: () => get(localStorage, REFRESH_KEY),
  getUser(): AdminUser | null {
    const value = get(localStorage, USER_KEY)
    if (!value) return null
    try { return JSON.parse(value) as AdminUser } catch { return null }
  },
  hasSession: () => Boolean(get(sessionStorage, ACCESS_KEY) || get(localStorage, REFRESH_KEY)),
  save(session: AuthSession) {
    set(sessionStorage, ACCESS_KEY, session.accessToken)
    set(localStorage, REFRESH_KEY, session.refreshToken)
    set(localStorage, USER_KEY, JSON.stringify(session.user))
    notify()
  },
  updateTokens(tokens: Pick<AuthSession, 'accessToken' | 'refreshToken'>) {
    set(sessionStorage, ACCESS_KEY, tokens.accessToken)
    set(localStorage, REFRESH_KEY, tokens.refreshToken)
    notify()
  },
  clear() {
    set(sessionStorage, ACCESS_KEY, null)
    set(localStorage, REFRESH_KEY, null)
    set(localStorage, USER_KEY, null)
    notify()
  },
}
