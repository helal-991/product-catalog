import React from 'react'
import { Product } from '@/lib/types'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const thumbnail = product.imageUrls[0] || '/placeholder.svg'

  return (
    <a href={`/products/${product.sku}`} className="product-card">
      <div className="product-card-image">
        <img src={thumbnail} alt={product.name} loading="lazy" />
      </div>
      <div className="product-card-body">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-meta">
          <span className="product-sku">SKU: {product.sku}</span>
          <span className="product-price">${product.price.toFixed(2)}</span>
        </div>
      </div>
    </a>
  )
}
