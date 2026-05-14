import type { NextApiRequest, NextApiResponse } from 'next'
import { saveOrder, getOrders, Order } from '@/lib/orders'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const orders = await getOrders()
      return res.status(200).json(orders)
    } catch (error: any) {
      console.error('Error fetching orders:', error)
      return res.status(500).json({ error: error.message || 'Failed to fetch orders' })
    }
  }

  if (req.method === 'POST') {
    try {
      const order = req.body as Order
      if (!order.id || !order.items || !order.supplier) {
        return res.status(400).json({ error: 'Invalid order data' })
      }
      await saveOrder(order)
      return res.status(200).json({ success: true })
    } catch (error: any) {
      console.error('Error saving order:', error)
      return res.status(500).json({ error: error.message || 'Failed to save order' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
