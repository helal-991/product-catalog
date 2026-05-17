import { Redis } from '@upstash/redis'

function getRedis(): Redis {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  })
}

const PAGE_PASSWORDS: Record<string, string | undefined> = {
  catalog: process.env.SITE_PASSWORD,
  invoice: process.env.INVOICE_PASSWORD,
  dashboard: process.env.DASHBOARD_PASSWORD,
}

export function checkPasswordServer(page: string, password: string): boolean {
  const correct = PAGE_PASSWORDS[page]
  return !!correct && password === correct
}

export async function createSession(page: string): Promise<string> {
  const { randomBytes } = await import('crypto')
  const token = randomBytes(32).toString('hex')
  const redis = getRedis()
  await redis.set(`session:${token}`, page, { ex: 3600 })
  return token
}

export async function validateSession(page: string, token: string): Promise<boolean> {
  if (!token) return false
  try {
    const redis = getRedis()
    const stored = await redis.get<string>(`session:${token}`)
    return stored === page
  } catch {
    return false
  }
}

export async function destroySession(token: string): Promise<void> {
  try {
    const redis = getRedis()
    await redis.del(`session:${token}`)
  } catch {}
}

export function getTokenFromRequest(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers.authorization
  if (!auth || Array.isArray(auth)) return null
  const parts = auth.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return parts[1] || null
}
