import type { NextApiRequest, NextApiResponse } from 'next'
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

function checkPassword(page: string, password: string): boolean {
  const correct = PAGE_PASSWORDS[page]
  return !!correct && password === correct
}

async function createSession(page: string): Promise<string> {
  const { randomBytes } = await import('crypto')
  const token = randomBytes(32).toString('hex')
  const redis = getRedis()
  await redis.set(`session:${token}`, page, { ex: 3600 })
  return token
}

async function validateSession(page: string, token: string): Promise<boolean> {
  if (!token) return false
  try {
    const redis = getRedis()
    const stored = await redis.get<string>(`session:${token}`)
    return stored === page
  } catch {
    return false
  }
}

async function destroySession(token: string): Promise<void> {
  try {
    const redis = getRedis()
    await redis.del(`session:${token}`)
  } catch {}
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, page, password, token } = req.body

  if (action === 'login') {
    if (!page || !password) {
      return res.status(400).json({ error: 'Page and password required' })
    }
    if (!['catalog', 'invoice', 'dashboard'].includes(page)) {
      return res.status(400).json({ error: 'Invalid page' })
    }
    if (!checkPassword(page, password)) {
      return res.status(401).json({ error: 'Invalid password' })
    }
    const sessionToken = await createSession(page)
    return res.status(200).json({ token: sessionToken })
  }

  if (action === 'verify') {
    if (!page || !token) {
      return res.json({ valid: false })
    }
    const valid = await validateSession(page, token)
    return res.json({ valid })
  }

  if (action === 'logout') {
    if (token) {
      await destroySession(token)
    }
    return res.json({ success: true })
  }

  return res.status(400).json({ error: 'Invalid action' })
}
