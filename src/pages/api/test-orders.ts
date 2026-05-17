import type { NextApiRequest, NextApiResponse } from 'next'
import { saveOrder, getOrders, Order } from '@/lib/orders'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const testOrder: Order = {
    id: `TEST-${Date.now()}`,
    date: new Date().toLocaleDateString('en-GB'),
    supplier: 'Test',
    companyName: 'Test Diagnostics',
    items: [{ sku: 'TEST', name: 'Test Product', qty: 1, unitPrice: 100, priceType: 'RDP' }],
    grandTotal: 100,
    paymentPlan: 'Cash',
    paymentDates: [],
    paymentAmounts: [],
  }

  try {
    console.log('TEST: saving order...')
    await saveOrder(testOrder)
    console.log('TEST: order saved, now reading all orders...')
    const orders = await getOrders()
    console.log(`TEST: found ${orders.length} orders`)
    return res.status(200).json({
      success: true,
      savedId: testOrder.id,
      savedMatch: orders.some((o) => o.id === testOrder.id),
      orderCount: orders.length,
      firstOrder: orders[0] || null,
    })
  } catch (e: any) {
    console.error('TEST ERROR:', e)
    return res.status(500).json({ error: e.message, stack: e.stack })
  }
}
