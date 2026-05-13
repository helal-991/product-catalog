import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { isAuthenticated } from '@/lib/auth'
import { Product } from '@/lib/types'
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
        (p) => p.sku.toLowerCase() === String(sku).toLowerCase()
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
          <a href="/products">&larr; Back to products</a>
        </div>
        <div className="empty-state">{error || 'Product not found'}</div>
      </div>
    )
  }

  return (
    <div className="product-detail">
      <div className="product-detail-back">
        <a href="/products">&larr; Back to products</a>
      </div>

      <ImageGallery images={product.imageUrls} productName={product.name} />

      <div className="product-detail-info">
        <span className="product-detail-category">{product.category}</span>
        {product.company && (
          <span className="product-detail-company">{product.company}</span>
        )}
        <h1>{product.name}</h1>
        <div className="product-detail-price">{product.price.toFixed(2)} EGP</div>
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
