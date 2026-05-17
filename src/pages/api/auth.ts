import type { NextApiRequest, NextApiResponse } from 'next'
import { checkPasswordServer, createSession, validateSession, destroySession } from '@/lib/auth-server'

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
    if (!checkPasswordServer(page, password)) {
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
