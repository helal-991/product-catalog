import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useLanguage } from '@/lib/i18n'
import { isAuthenticated, startInactivityTimer, stopInactivityTimer } from '@/lib/auth'
import { Product } from '@/lib/types'

function brandSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function brandLogoPath(name: string): string {
  return `/${brandSlug(name)}-logo.png`
}

export default function BrandsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [authed, setAuthed] = useState(false)
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
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
    if (!authed) return
    fetchBrands()
  }, [authed])

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

  if (checking) {
    return <div className="loading">{t('Loading...')}</div>
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
