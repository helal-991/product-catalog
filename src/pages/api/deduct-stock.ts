import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchProducts } from '@/lib/excel'
import { deductStock } from '@/lib/stock'
import { saveOrder, Order } from '@/lib/orders'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(500).json({
      success: false,
      errors: ['Stock tracking is not configured (missing KV env vars).'],
    })
  }

  try {
    const { items, order } = req.body as {
      items: { sku: string; qty: number }[]
      order?: Order
    }

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
    const deductResult = await deductStock(items, products)

    if (!deductResult.success) {
      return res.status(409).json(deductResult)
    }

    let orderSaved = false
    if (order && order.id && order.items && order.supplier) {
      try {
        await saveOrder(order)
        orderSaved = true
      } catch (e) {
        console.error('saveOrder failed:', e)
      }
    }

    return res.status(200).json({ success: true, errors: [], orderSaved })
  } catch (error: any) {
    console.error('Error deducting stock:', error)
    return res.status(500).json({ success: false, errors: [error.message || 'Failed to deduct stock'] })
  }
}
