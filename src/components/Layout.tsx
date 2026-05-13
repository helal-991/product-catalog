import React, { ReactNode, useEffect, useState } from 'react'
import { auth, signOut } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!auth) return
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  const handleLogout = async () => {
    if (!auth) return
    await signOut(auth)
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <a href="/products" className="logo">
            Product Catalog
          </a>
          {user && (
            <div className="header-right">
              <span className="phone-display">{user.phoneNumber}</span>
              <button onClick={handleLogout} className="btn-outline btn-sm">
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  )
}
