const AUTH_KEY = 'pc_auth'
const INVOICE_AUTH_KEY = 'pc_invoice_auth'
const DASHBOARD_AUTH_KEY = 'pc_dashboard_auth'
const INACTIVITY_MS = 60000

let inactivityTimer: ReturnType<typeof setTimeout> | null = null
let activityCleanup: (() => void) | null = null

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(AUTH_KEY) === 'true'
}

export function login(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_KEY, 'true')
}

export function logout(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_KEY)
}

export function checkPassword(password: string): boolean {
  const correct = process.env.NEXT_PUBLIC_SITE_PASSWORD || ''
  return password === correct
}

export function isInvoiceAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(INVOICE_AUTH_KEY) === 'true'
}

export function invoiceLogin(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(INVOICE_AUTH_KEY, 'true')
}

export function invoiceLogout(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(INVOICE_AUTH_KEY)
}

export function checkInvoicePassword(password: string): boolean {
  const correct = process.env.NEXT_PUBLIC_INVOICE_PASSWORD || ''
  return password === correct
}

export function isDashboardAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(DASHBOARD_AUTH_KEY) === 'true'
}

export function dashboardLogin(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(DASHBOARD_AUTH_KEY, 'true')
}

export function dashboardLogout(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(DASHBOARD_AUTH_KEY)
}

export function checkDashboardPassword(password: string): boolean {
  const correct = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || ''
  return password === correct
}

export function clearAllAuth(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_KEY)
  sessionStorage.removeItem(INVOICE_AUTH_KEY)
  sessionStorage.removeItem(DASHBOARD_AUTH_KEY)
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
