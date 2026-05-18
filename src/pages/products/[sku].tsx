import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useLanguage } from '@/lib/i18n'
import { isAuthenticated, startInactivityTimer, stopInactivityTimer } from '@/lib/auth'
import { Product, fmtPrice, brandClass } from '@/lib/types'
import ImageGallery from '@/components/ImageGallery'

export default function ProductDetailPage() {
  const router = useRouter()
  const { sku } = router.query
  const { t, lang } = useLanguage()
  const [authed, setAuthed] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [error, setError] = useState('')
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
    if (!authed || !sku) return
    fetchProduct()
  }, [authed, sku])

  const fetchProduct = async () => {
    setError('')
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error(t('Failed to load product'))
      const data: Product[] = await res.json()
      const found = data.find(
        (p) => p.sku.toLowerCase() === String(sku).toLowerCase() ||
              p.name.toLowerCase() === String(sku).toLowerCase()
      )
      if (!found) throw new Error(t('Product not found'))
      setProduct(found)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (checking) {
    return <div className="loading">{t('Loading...')}</div>
  }

  if (!authed) {
    return <div className="loading">{t('Loading...')}</div>
  }

  if (error || !product) {
    return (
      <div>
        <div className="error-msg" style={{ margin: 32 }}>{error || t('Product not found')}</div>
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => router.back()} className="btn-outline">{t('Go Back')}</button>
        </div>
      </div>
    )
  }

  const bgClass = brandClass(product.company)
  const name = lang === 'ar' && product.nameAr ? product.nameAr : product.name
  const description = product.description
    ? (lang === 'ar' && product.descriptionAr ? product.descriptionAr : product.description)
    : ''
  const category = product.category
    ? (lang === 'ar' && product.categoryAr ? product.categoryAr : product.category)
    : ''

  return (
    <div className={`product-detail-page ${bgClass}`}>
      <button onClick={() => router.back()} className="btn-outline" style={{ marginBottom: 16, fontSize: '1.5rem', padding: '12px 24px' }}>
        {t('Back')}
      </button>
      <div className="product-detail">
        <ImageGallery
          images={product.imageUrls}
          productName={name}
        />
        <div className="product-detail-info">
          <h1>{name}</h1>
          {product.sku && <p className="product-detail-sku">{t('SKU:')} {product.sku}</p>}
          {category && <p className="product-detail-category">{category}</p>}
          {description && (
            <p className="product-detail-desc">{description}</p>
          )}
          <div className="price-boxes">
            <div className="price-box">
              <span className="price-label">{t('RRP')}</span>
              <span className="price-value">{fmtPrice(product.rrp)} {t('EGP')}</span>
            </div>
            <div className="price-box">
              <span className="price-label">{t('RDP')}</span>
              <span className="price-value">{fmtPrice(product.rdp)} {t('EGP')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
