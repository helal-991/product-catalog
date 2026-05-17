import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { isAuthenticated, startInactivityTimer, stopInactivityTimer } from '@/lib/auth'
import { Product } from '@/lib/types'
import ProductCard from '@/components/ProductCard'

const brandNames: Record<string, string> = {
  'master-elektron': 'Master Elektron',
  'argosta': 'Argosta',
}

export default function ProductsPage() {
  const router = useRouter()
  const { brand: brandSlug } = router.query

  const [authed, setAuthed] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    isAuthenticated().then((ok) => {
      if (!ok) {
        router.replace('/')
      } else {
        setAuthed(true)
        setChecking(false)
        startInactivityTimer(() => router.replace('/'))
      }
    })
    return () => stopInactivityTimer()
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

  const brandName = brandSlug
    ? Object.entries(brandNames).find(([, v]) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-') === brandSlug)?.[1] || decodeURIComponent(brandSlug as string)
    : null

  const filtered = products
    .filter((p) => !brandName || p.company.toLowerCase() === brandName.toLowerCase())
    .filter((p) => !selectedCategory || p.category === selectedCategory)
    .filter((p) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      )
    })

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[]

  if (checking) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="products-page">
      <div className="products-header">
        {brandName && (
          <button onClick={() => router.back()} className="btn-outline" style={{ marginRight: 12 }}>
            Back
          </button>
        )}
        <h1 style={{ flex: 1 }}>{brandName ? brandName + ' Products' : 'All Products'}</h1>
        <input
          className="search-input"
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="category-filters">
          <button
            className={`category-chip ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      {dataLoading ? (
        <div className="loading">Loading products...</div>
      ) : filtered.length === 0 ? (
        <div className="loading">No products found.</div>
      ) : (
        <div className="product-grid">
          {filtered.map((p) => (
            <ProductCard key={p.sku || p.name} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
