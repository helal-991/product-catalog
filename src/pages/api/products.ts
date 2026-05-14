import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchProducts } from '@/lib/excel'
import { getEffectiveStockMap } from '@/lib/stock'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const products = await fetchProducts()
    const includeStock = req.query.includeStock === 'true'

    if (includeStock) {
      const stockMap = await getEffectiveStockMap(products)
      const enriched = products.map((p) => {
        const id = p.sku || p.name
        return {
          ...p,
          stock: stockMap[id] ?? 0,
        }
      })
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      return res.status(200).json(enriched)
    }

    const safe = products.map(({ stock, ...rest }) => rest)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.status(200).json(safe)
  } catch (error: any) {
    console.error('Error fetching products:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch products' })
  }
}
