import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { isAuthenticated } from '@/lib/auth'
import { Product } from '@/lib/types'
import ProductCard from '@/components/ProductCard'

export default function ProductsPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/')
    } else {
      setAuthed(true)
    }
  }, [router])

  useEffect(() => {
    if (!authed) return
    fetchProducts()
  }, [authed])

  const fetchProducts = async () => {
    setDataLoading(true)
    setError('')
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to load products')
      const data = await res.json()
      setProducts(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load products')
    } finally {
      setDataLoading(false)
    }
  }

  const filtered = products.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    )
  })

  if (!authed || dataLoading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div>
      <div className="products-header">
        <h1>Products</h1>
        <p>{products.length} products available</p>
        <input
          type="text"
          placeholder="Search by name, SKU, or category..."
          className="search-bar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {error && <div className="error-msg">{error}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          {search ? 'No products match your search.' : 'No products found.'}
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map((product) => (
            <ProductCard key={product.sku} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
