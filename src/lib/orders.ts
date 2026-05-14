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
  const raw = await redis.get<string>(ORDERS_KEY)
  const orders: Order[] = raw ? JSON.parse(raw) : []
  orders.unshift(order)
  await redis.set(ORDERS_KEY, JSON.stringify(orders))
}

export async function getOrders(): Promise<Order[]> {
  const redis = getRedis()
  const raw = await redis.get<string>(ORDERS_KEY)
  return raw ? JSON.parse(raw) : []
}
