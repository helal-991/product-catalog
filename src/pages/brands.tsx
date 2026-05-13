import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { isAuthenticated } from '@/lib/auth'
import { Product } from '@/lib/types'

function brandSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function brandLogoPath(name: string): string {
  return `/${brandSlug(name)}-logo.png`
}

export default function BrandsPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/')
    } else {
      setAuthed(true)
    }
  }, [router])

  useEffect(() => {
    if (!authed) return
    fetchBrands()
  }, [authed])

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/products')
      const data: Product[] = await res.json()
      const unique = Array.from(new Set(data.map((p) => p.company).filter(Boolean)))
      setBrands(unique.length ? unique : ['All Products'])
    } catch {
      setBrands(['All Products'])
    } finally {
      setLoading(false)
    }
  }

  if (!authed || loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="brands-page">
      <h1>Choose Brand</h1>
      <p>Select a brand to view its products</p>
      <div className="brands-grid">
        {brands.map((brand) => {
          const slug = brand === 'All Products' ? '' : brandSlug(brand)
          const logoSrc = brandLogoPath(brand)
          const initials = brand.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          return (
            <button
              key={brand}
              className="brand-card"
              onClick={() => router.push(`/products?brand=${slug}`)}
            >
              <div className="brand-logo-wrap">
                <img
                  src={logoSrc}
                  alt={brand}
                  className="brand-logo"
                  onError={(e) => {
                    const el = e.currentTarget
                    el.style.display = 'none'
                    const next = el.nextElementSibling as HTMLElement
                    if (next) next.style.display = 'flex'
                  }}
                />
                <div className="brand-logo-fallback" style={{ display: 'none' }}>
                  {initials}
                </div>
              </div>
              <span className="brand-name">{brand}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
