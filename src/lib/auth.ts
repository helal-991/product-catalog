const AUTH_KEY = 'pc_auth'

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
