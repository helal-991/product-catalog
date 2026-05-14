import type { NextApiRequest, NextApiResponse } from 'next'
import { setManualStock, getManualOverrides } from '@/lib/stock'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(500).json({ error: 'Stock tracking is not configured (missing KV env vars)' })
  }

  try {
    const { sku, stock } = req.body as { sku: string; stock: number }

    if (!sku || !Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({ error: 'Invalid input: sku (string) and stock (non-negative integer) required' })
    }

    await setManualStock(sku, stock)
    return res.status(200).json({ success: true, sku, stock })
  } catch (error: any) {
    console.error('Error setting stock:', error)
    return res.status(500).json({ error: error.message || 'Failed to set stock' })
  }
}
