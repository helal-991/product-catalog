import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Product } from '@/lib/types'
import ImageGallery from '@/components/ImageGallery'

export default function ProductDetailPage() {
  const router = useRouter()
  const { sku } = router.query
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<Product | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!auth) return
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace('/')
      } else {
        setUser(u)
        setLoading(false)
      }
    })
    return () => unsub()
  }, [router])

  useEffect(() => {
    if (!user || !sku) return
    fetchProduct()
  }, [user, sku])

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
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
        <h1>{product.name}</h1>
        <div className="product-detail-price">${product.price.toFixed(2)}</div>
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
