import React, { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { isAuthenticated, logout } from '@/lib/auth'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    setAuthed(isAuthenticated())
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const showHeader = router.pathname !== '/' || authed

  return (
    <div className="layout">
      {showHeader && (
        <header className="header">
          <div className="header-inner">
            <a href="/products" className="logo">
              Product Catalog
            </a>
            {authed && (
              <div className="header-right">
                <button onClick={handleLogout} className="btn-outline btn-sm">
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
      )}
      <main className="main">{children}</main>
    </div>
  )
}
