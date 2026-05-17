import type { NextApiRequest, NextApiResponse } from 'next'
import { Redis } from '@upstash/redis'

function getRedis(): Redis {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  })
}

function checkPassword(password: string): boolean {
  return !!process.env.SITE_PASSWORD && password === process.env.SITE_PASSWORD
}

async function createSession(): Promise<string> {
  const { randomBytes } = await import('crypto')
  const token = randomBytes(32).toString('hex')
  const redis = getRedis()
  await redis.set(`session:${token}`, 'catalog', { ex: 3600 })
  return token
}

async function validateSession(token: string): Promise<boolean> {
  if (!token) return false
  try {
    const redis = getRedis()
    const stored = await redis.get<string>(`session:${token}`)
    return stored === 'catalog'
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

  const { action, password, token } = req.body

  if (action === 'login') {
    if (!password) {
      return res.status(400).json({ error: 'Password required' })
    }
    if (!checkPassword(password)) {
      return res.status(401).json({ error: 'Invalid password' })
    }
    const sessionToken = await createSession()
    return res.status(200).json({ token: sessionToken })
  }

  if (action === 'verify') {
    if (!token) {
      return res.json({ valid: false })
    }
    const valid = await validateSession(token)
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
