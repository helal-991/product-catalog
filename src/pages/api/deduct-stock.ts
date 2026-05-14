import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchProducts } from '@/lib/excel'
import { deductStock } from '@/lib/stock'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return res.status(500).json({
      success: false,
      errors: ['Stock tracking is not configured (missing Upstash Redis env vars). Please add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.'],
    })
  }

  try {
    const { items } = req.body as { items: { sku: string; qty: number }[] }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, errors: ['No items provided'] })
    }

    for (const item of items) {
      if (!item.sku || !Number.isInteger(item.qty) || item.qty < 1) {
        return res.status(400).json({
          success: false,
          errors: [`Invalid item: sku="${item.sku}", qty=${item.qty}`],
        })
      }
    }

    const products = await fetchProducts()
    const result = await deductStock(items, products)

    if (!result.success) {
      return res.status(409).json(result)
    }

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error deducting stock:', error)
    return res.status(500).json({ success: false, errors: [error.message || 'Failed to deduct stock'] })
  }
}
