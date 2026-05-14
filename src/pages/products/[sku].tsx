import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { isAuthenticated } from '@/lib/auth'
import { Product, fmtPrice, brandClass } from '@/lib/types'
import ImageGallery from '@/components/ImageGallery'

export default function ProductDetailPage() {
  const router = useRouter()
  const { sku } = router.query
  const [authed, setAuthed] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/')
    } else {
      setAuthed(true)
    }
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

  if (!authed) {
    return <div className="loading">Loading...</div>
  }

  if (error || !product) {
    return (
      <div>
        <div className="product-detail-back">
          <button onClick={() => router.back()} className="back-btn">&larr; Back to products</button>
        </div>
        <div className="empty-state">{error || 'Product not found'}</div>
      </div>
    )
  }

  return (
    <div className="product-detail">
      <div className="product-detail-back">
        <button onClick={() => router.back()} className="back-btn">&larr; Back to products</button>
      </div>

      <ImageGallery images={product.imageUrls} productName={product.name} />

      <div className="product-detail-info">
        <span className="product-detail-category">{product.category}</span>
        {product.company && (
          <span className="product-detail-company">{product.company}</span>
        )}
        <h1>{product.name}</h1>
        <div className={`product-detail-prices ${brandClass(product.company)}`}>
          <div className="price-box">
            <span className="price-box-label">RRP</span>
            <strong className="price-box-value">{fmtPrice(product.rrp)} EGP</strong>
          </div>
          <div className="price-box">
            <span className="price-box-label">RDP</span>
            <strong className="price-box-value">{fmtPrice(product.rdp)} EGP</strong>
          </div>
        </div>
        <p className="product-detail-description">{product.description}</p>
        <div className="product-detail-meta">
          <span>
            <strong>SKU</strong> <span>{product.sku}</span>
          </span>
          <span>
            <strong>Barcode</strong> <span>{product.barcode}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
