import { Redis } from '@upstash/redis'
import { InvoiceItem } from './invoice'

function getRedis(): Redis {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  })
}

const ORDERS_KEY = 'orders:data'

export interface Order {
  id: string
  date: string
  supplier: string
  companyName: string
  items: InvoiceItem[]
  grandTotal: number
  paymentPlan: string
  paymentDates: string[]
  paymentAmounts: number[]
}

export async function saveOrder(order: Order): Promise<void> {
  const redis = getRedis()
  await redis.hset(ORDERS_KEY, { [order.id]: order })
}

export async function deleteOrder(id: string): Promise<void> {
  const redis = getRedis()
  await redis.hdel(ORDERS_KEY, id)
}

export async function getOrders(): Promise<Order[]> {
  const redis = getRedis()
  const raw = await redis.hgetall<Record<string, Order>>(ORDERS_KEY)
  if (!raw) return []
  return Object.values(raw).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
}
