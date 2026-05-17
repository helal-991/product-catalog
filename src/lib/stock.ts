import { Redis } from '@upstash/redis'
import { Product } from './types'

function getRedis(): Redis {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  })
}

const DEDUCTIONS_KEY = 'stock:deductions'
const MANUAL_KEY = 'stock:manual'

function productId(p: Product): string {
  return p.sku || p.name
}

export async function getDeductions(): Promise<Record<string, number>> {
  const redis = getRedis()
  const raw = await redis.hgetall<Record<string, number>>(DEDUCTIONS_KEY)
  return raw || {}
}

export function effectiveStock(initial: number, deducted: number): number {
  return initial - deducted
}

export async function getManualOverrides(): Promise<Record<string, number>> {
  const redis = getRedis()
  const raw = await redis.hgetall<Record<string, number>>(MANUAL_KEY)
  return raw || {}
}

export async function setManualStock(sku: string, stock: number): Promise<void> {
  const redis = getRedis()
  await redis.hset(MANUAL_KEY, { [sku]: stock })
}

export async function getEffectiveStockMap(
  products: Product[]
): Promise<Record<string, number>> {
  const [deductions, manualOverrides] = await Promise.all([
    getDeductions(),
    getManualOverrides(),
  ])

  const map: Record<string, number> = {}
  for (const p of products) {
    const id = productId(p)
    const deducted = deductions[id] || 0
    if (manualOverrides[id] !== undefined) {
      map[id] = manualOverrides[id]
    } else {
      map[id] = effectiveStock(p.stock, deducted)
    }
  }
  return map
}

export async function checkStock(
  items: { sku: string; qty: number }[],
  products: Product[]
): Promise<{ ok: boolean; errors: string[] }> {
  const deductions = await getDeductions()
  const manualOverrides = await getManualOverrides()
  const errors: string[] = []

  for (const item of items) {
    const product = products.find((p) => productId(p) === item.sku)
    if (!product) {
      errors.push(`Product "${item.sku}" not found`)
      continue
    }
    const id = productId(product)
    if (manualOverrides[id] !== undefined) {
      if (manualOverrides[id] < item.qty) {
        errors.push(
          `"${product.name}" — available: ${manualOverrides[id]}, requested: ${item.qty}`
        )
      }
    } else {
      const deducted = deductions[id] || 0
      const available = effectiveStock(product.stock, deducted)
      if (available < item.qty) {
        errors.push(
          `"${product.name}" — available: ${available}, requested: ${item.qty}`
        )
      }
    }
  }

  return { ok: errors.length === 0, errors }
}

export async function deductStock(
  items: { sku: string; qty: number }[],
  products: Product[]
): Promise<{ success: boolean; errors: string[] }> {
  const check = await checkStock(items, products)
  if (!check.ok) {
    return { success: false, errors: check.errors }
  }

  const redis = getRedis()
  for (const item of items) {
    await redis.hincrby(DEDUCTIONS_KEY, item.sku, item.qty)
  }

  return { success: true, errors: [] }
}

export async function restoreStock(
  items: { sku: string; qty: number }[]
): Promise<void> {
  const redis = getRedis()
  for (const item of items) {
    const current = await redis.hincrby(DEDUCTIONS_KEY, item.sku, -item.qty)
    if (current <= 0) {
      await redis.hdel(DEDUCTIONS_KEY, item.sku)
    }
  }
}
