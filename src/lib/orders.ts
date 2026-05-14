import { Redis } from '@upstash/redis'
import { InvoiceItem } from './invoice'

function getRedis(): Redis {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  })
}

const ORDERS_KEY = 'orders'

export interface Order {
  id: string
  date: string
  supplier: string
  companyName: string
  items: InvoiceItem[]
  grandTotal: number
}

export async function saveOrder(order: Order): Promise<void> {
  const redis = getRedis()
  await redis.lpush(ORDERS_KEY, JSON.stringify(order))
}

export async function getOrders(): Promise<Order[]> {
  const redis = getRedis()
  const raw = await redis.lrange<string>(ORDERS_KEY, 0, -1)
  if (!raw || raw.length === 0) return []
  return raw.map((item) => JSON.parse(item))
}
