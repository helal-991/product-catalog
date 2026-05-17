const INACTIVITY_MS = 60000
let inactivityTimer: ReturnType<typeof setTimeout> | null = null
let activityCleanup: (() => void) | null = null

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('auth_token')
}

function storeToken(token: string): void {
  sessionStorage.setItem('auth_token', token)
}

function removeToken(): void {
  sessionStorage.removeItem('auth_token')
}

export async function login(password: string): Promise<boolean> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', password }),
    })
    const data = await res.json()
    if (data.token) {
      storeToken(data.token)
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = getStoredToken()
  if (!token) return false
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token }),
    })
    const data = await res.json()
    return data.valid === true
  } catch {
    return false
  }
}

export async function logout(): Promise<void> {
  const token = getStoredToken()
  removeToken()
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

function resetInactivityTimer(redirect: () => void) {
  if (inactivityTimer) clearTimeout(inactivityTimer)
  inactivityTimer = setTimeout(() => {
    removeToken()
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
