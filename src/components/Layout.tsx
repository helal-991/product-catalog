import React, { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { isAuthenticated, logout, startInactivityTimer, stopInactivityTimer } from '@/lib/auth'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [currentPage, setCurrentPage] = useState<string | null>(null)

  useEffect(() => {
    const path = router.pathname
    let page = ''
    if (path === '/') {
      page = 'catalog'
    } else if (path.startsWith('/invoice')) {
      page = 'invoice'
    } else if (path.startsWith('/dashboard')) {
      page = 'dashboard'
    } else if (path.startsWith('/brands') || path.startsWith('/products')) {
      page = 'catalog'
    } else {
      return
    }
    isAuthenticated(page).then((ok) => {
      if (ok) {
        setAuthed(true)
        setCurrentPage(page)
        startInactivityTimer(() => router.push('/'))
      }
    })
    return () => stopInactivityTimer()
  }, [router.pathname, router])

  const handleLogout = async () => {
    if (currentPage) {
      await logout(currentPage)
    }
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
