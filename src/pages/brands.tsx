import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { isAuthenticated } from '@/lib/auth'
import { Product } from '@/lib/types'

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
          const slug = brand === 'All Products' ? '' : brand.toLowerCase().replace(/\s+/g, '-')
          return (
            <button
              key={brand}
              className="brand-card"
              onClick={() => router.push(`/products?brand=${slug}`)}
            >
              <span className="brand-name">{brand}</span>
              <span className="brand-arrow">&rarr;</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
