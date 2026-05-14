import React from 'react'
import Link from 'next/link'
import { Product, fmtPrice, brandColor } from '@/lib/types'

interface ProductCardProps {
  product: Product
}

function brandClass(company: string): string {
  const slug = company.toLowerCase().replace(/\s+/g, '-')
  return brandColor[slug] ? `brand-${slug}` : ''
}

export default function ProductCard({ product }: ProductCardProps) {
  const thumbnail = product.imageUrls[0] || '/placeholder.svg'
  const productId = product.sku || product.name
  const cardClass = `product-card ${brandClass(product.company)}`

  const content = (
    <>
      <div className="product-card-image">
        <img src={thumbnail} alt={product.name} loading="lazy" />
      </div>
      <div className="product-card-body">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>
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
