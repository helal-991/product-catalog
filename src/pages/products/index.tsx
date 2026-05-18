import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useLanguage } from '@/lib/i18n'
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
  const { t } = useLanguage()

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
      if (!res.ok) throw new Error(t('Failed to load products'))
      const data = await res.json()
      setProducts(data)
    } catch (err: any) {
      setError(err.message || t('Failed to load products'))
    } finally {
      setDataLoading(false)
    }
  }

  const selectedBrand = brandSlug && brandSlug !== ''
    ? (brandNames[String(brandSlug).toLowerCase()] || String(brandSlug))
    : ''

  const companyFiltered = selectedBrand
    ? products.filter((p) => p.company.toLowerCase() === selectedBrand.toLowerCase())
    : products

  const categories = Array.from(new Set(companyFiltered.map((p) => p.category.trim()).filter(Boolean))).sort()

  const categoryFiltered = selectedCategory
    ? companyFiltered.filter((p) => p.category.trim().toLowerCase() === selectedCategory.toLowerCase())
    : companyFiltered

  const q = search.trim().toLowerCase()
  const searchFiltered = categoryFiltered.filter((p) => {
    if (!q) return true
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )
  })

  if (checking) {
    return <div className="loading">{t('Loading...')}</div>
  }

  if (!authed) {
    return <div className="loading">{t('Loading...')}</div>
  }

  if (dataLoading) {
    return <div className="loading">{t('Loading products...')}</div>
  }

  return (
    <div>
      <div className="products-header">
        <div className="products-header-top">
          <a href="/brands" className="back-link">&larr; {t('Change Brand')}</a>
          <h1>{selectedBrand || t('All Products')}</h1>
        </div>
        <p>{searchFiltered.length} {searchFiltered.length !== 1 ? t('products') : t('product')}</p>
        <input
          type="text"
          placeholder={t('Search by name, SKU, or category...')}
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
            onClick={() => {
              setSelectedCategory('')
              window.scrollTo(0, 0)
            }}
          >
            {t('All')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(cat)
                window.scrollTo(0, 0)
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      {searchFiltered.length === 0 ? (
        <div className="empty-state">
          {search ? t('No products match your search.') : t('No products found.')}
        </div>
      ) : (
        <div className="products-grid" key={`${selectedCategory || 'all'}-${q}`}>
          {searchFiltered.map((product) => (
            <ProductCard key={product.sku || product.name} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
