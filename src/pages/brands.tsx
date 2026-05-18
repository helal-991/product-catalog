import React, { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/i18n'
import { Product } from '@/lib/types'

function brandSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function brandLogoPath(name: string): string {
  return `/${brandSlug(name)}-logo.png`
}

export default function BrandsPage() {
  const { t } = useLanguage()
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/products')
      const data: Product[] = await res.json()
      const unique = Array.from(new Set(data.map((p) => p.company).filter(Boolean)))
      setBrands(unique.sort())
    } catch {} finally {
      setLoading(false)
    }
  }

  return (
    <div className="brands-page">
      {loading ? (
        <div className="loading">{t('Loading brands...')}</div>
      ) : (
        <div className="brand-grid">
          {brands.map((brand) => (
            <a key={brand} href={`/products?brand=${brandSlug(brand)}`} className="brand-link">
              <div className="brand-logo-card">
                <img
                  src={brandLogoPath(brand)}
                  alt={brand}
                  className="brand-logo-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
