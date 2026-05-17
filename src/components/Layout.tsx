import React, { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { isAuthenticated, logout, startInactivityTimer, stopInactivityTimer } from '@/lib/auth'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const path = router.pathname
    if (path === '/' || path === '/brands' || path === '/products' || path.startsWith('/products/')) {
      isAuthenticated().then((ok) => {
        if (ok) {
          setAuthed(true)
          startInactivityTimer(() => router.push('/'))
        }
      })
    }
    return () => stopInactivityTimer()
  }, [router.pathname, router])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const showHeader = router.pathname !== '/' || authed

  return (
    <div className="layout">
      {showHeader && (
        <header className="header">
          <div className="header-inner">
            <a href="/brands" className="logo">
              <img src="/elbeshbeshy-logo.png" alt="Elbeshbeshy" className="logo-img" />
              <span>Elbeshbeshy Product Catalog</span>
            </a>
            <div className="header-right">
              {authed && (
                <button onClick={handleLogout} className="btn-outline btn-sm">
                  Logout
                </button>
              )}
            </div>
          </div>
        </header>
      )}
      <main className="main">{children}</main>
    </div>
  )
}
