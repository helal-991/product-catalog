const INACTIVITY_MS = 60000
let inactivityTimer: ReturnType<typeof setTimeout> | null = null
let activityCleanup: (() => void) | null = null

function getTokenKey(page: string): string {
  return `auth_token_${page}`
}

function getStoredToken(page: string): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(getTokenKey(page))
}

function storeToken(page: string, token: string): void {
  sessionStorage.setItem(getTokenKey(page), token)
}

function removeToken(page: string): void {
  sessionStorage.removeItem(getTokenKey(page))
}

export async function login(page: string, password: string): Promise<boolean> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', page, password }),
    })
    const data = await res.json()
    if (data.token) {
      storeToken(page, data.token)
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function isAuthenticated(page: string): Promise<boolean> {
  const token = getStoredToken(page)
  if (!token) return false
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', page, token }),
    })
    const data = await res.json()
    return data.valid === true
  } catch {
    return false
  }
}

export async function logout(page: string): Promise<void> {
  const token = getStoredToken(page)
  removeToken(page)
  if (token) {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', token }),
      })
    } catch {}
  }
}

function clearAllAuth(): void {
  ;['catalog', 'invoice', 'dashboard'].forEach((p) => removeToken(p))
}

function resetInactivityTimer(redirect: () => void) {
  if (inactivityTimer) clearTimeout(inactivityTimer)
  inactivityTimer = setTimeout(() => {
    clearAllAuth()
    activityCleanup?.()
    activityCleanup = null
    redirect()
  }, INACTIVITY_MS)
}

export function startInactivityTimer(redirect: () => void): void {
  if (typeof window === 'undefined') return
  stopInactivityTimer()
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']
  const handler = () => resetInactivityTimer(redirect)
  events.forEach((e) => window.addEventListener(e, handler, { passive: true }))
  activityCleanup = () => events.forEach((e) => window.removeEventListener(e, handler))
  resetInactivityTimer(redirect)
}

export function stopInactivityTimer(): void {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
    inactivityTimer = null
  }
  activityCleanup?.()
  activityCleanup = null
}
