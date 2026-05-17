import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { isAuthenticated, startInactivityTimer, stopInactivityTimer } from '@/lib/auth'
import { Product, fmtPrice, brandClass } from '@/lib/types'
import ImageGallery from '@/components/ImageGallery'

export default function ProductDetailPage() {
  const router = useRouter()
  const { sku } = router.query
  const [authed, setAuthed] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    isAuthenticated('catalog').then((ok) => {
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
    if (!authed || !sku) return
    fetchProduct()
  }, [authed, sku])

  const fetchProduct = async () => {
    setError('')
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to load product')
      const data: Product[] = await res.json()
      const found = data.find(
        (p) => p.sku.toLowerCase() === String(sku).toLowerCase() ||
              p.name.toLowerCase() === String(sku).toLowerCase()
      )
      if (!found) throw new Error('Product not found')
      setProduct(found)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (checking) {
    return <div className="loading">Loading...</div>
  }

  if (!authed) {
    return <div className="loading">Loading...</div>
  }

  if (error || !product) {
    return (
      <div>
        <div className="error-msg" style={{ margin: 32 }}>{error || 'Product not found'}</div>
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => router.back()} className="btn-outline">Go Back</button>
        </div>
      </div>
    )
  }

  const bgClass = brandClass(product.company)
  const backPath = product.company
    ? `/products?brand=${product.company.toLowerCase().replace(/\s+/g, '-')}`
    : '/products'

  return (
    <div className={`product-detail-page ${bgClass}`}>
      <button onClick={() => router.back()} className="btn-outline" style={{ marginBottom: 16 }}>
        Back
      </button>
      <div className="product-detail">
        <ImageGallery
          images={product.imageUrls}
          productName={product.name}
        />
        <div className="product-detail-info">
          <h1>{product.name}</h1>
          {product.sku && <p className="product-detail-sku">SKU: {product.sku}</p>}
          {product.category && <p className="product-detail-category">{product.category}</p>}
          {product.description && (
            <p className="product-detail-desc">{product.description}</p>
          )}
          <div className="price-boxes">
            <div className="price-box">
              <span className="price-label">RRP</span>
              <span className="price-value">{fmtPrice(product.rrp)} EGP</span>
            </div>
            <div className="price-box">
              <span className="price-label">RDP</span>
              <span className="price-value">{fmtPrice(product.rdp)} EGP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
