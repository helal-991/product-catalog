import React from 'react'
import Link from 'next/link'
import { Product, fmtPrice, brandColor } from '@/lib/types'
import { useLanguage } from '@/lib/i18n'

interface ProductCardProps {
  product: Product
}

function brandClass(company: string): string {
  const slug = company.toLowerCase().replace(/\s+/g, '-')
  return brandColor[slug] ? `brand-${slug}` : ''
}

export default function ProductCard({ product }: ProductCardProps) {
  const { lang } = useLanguage()
  const thumbnail = product.imageUrls[0] || '/placeholder.svg'
  const productId = product.sku || product.name
  const cardClass = `product-card ${brandClass(product.company)}`

  const name = lang === 'ar' && product.nameAr ? product.nameAr : product.name
  const category = lang === 'ar' && product.categoryAr ? product.categoryAr : product.category

  const content = (
    <>
      <div className="product-card-image">
        <img src={thumbnail} alt={name} loading="lazy" />
      </div>
      <div className="product-card-body">
        {category && <span className="product-category">{category}</span>}
        <h3 className="product-name">{name}</h3>
        <div className="product-meta">
          <span className="product-sku">SKU {product.sku}</span>
          <div className="product-prices">
            <div className="product-card-price-box">
              <span className="price-box-label">RRP</span>
              <strong className="price-box-value">{fmtPrice(product.rrp)} EGP</strong>
            </div>
            <div className="product-card-price-box">
              <span className="price-box-label">RDP</span>
              <strong className="price-box-value">{fmtPrice(product.rdp)} EGP</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return productId ? (
    <Link href={`/products/${encodeURIComponent(productId)}`} className={cardClass}>
      {content}
    </Link>
  ) : (
    <div className={cardClass}>
      {content}
    </div>
  )
}
