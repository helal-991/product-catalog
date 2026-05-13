import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { isAuthenticated } from '@/lib/auth'
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

  const selectedBrand = brandSlug && brandSlug !== ''
    ? (brandNames[String(brandSlug).toLowerCase()] || String(brandSlug))
    : ''

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

  const companyFiltered = selectedBrand
    ? products.filter((p) => p.company.toLowerCase() === selectedBrand.toLowerCase())
    : products

  const categories = Array.from(new Set(companyFiltered.map((p) => p.category).filter(Boolean))).sort()

  const categoryFiltered = selectedCategory
    ? companyFiltered.filter((p) => p.category === selectedCategory)
    : companyFiltered

  const searchFiltered = categoryFiltered.filter((p) => {
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
        <div className="products-header-top">
          <a href="/brands" className="back-link">&larr; Change Brand</a>
          <h1>{selectedBrand || 'All Products'}</h1>
        </div>
        <p>{searchFiltered.length} product{searchFiltered.length !== 1 ? 's' : ''}</p>
        <input
          type="text"
          placeholder="Search by name, SKU, or category..."
          className="search-bar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

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

      {searchFiltered.length === 0 ? (
        <div className="empty-state">
          {search ? 'No products match your search.' : 'No products found.'}
        </div>
      ) : (
        <div className="products-grid">
          {searchFiltered.map((product) => (
            <ProductCard key={product.sku} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
