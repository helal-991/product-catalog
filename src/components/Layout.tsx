import React, { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  isAuthenticated,
  logout,
  isInvoiceAuthenticated,
  invoiceLogout,
  startInactivityTimer,
  stopInactivityTimer,
} from '@/lib/auth'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [invoiceAuthed, setInvoiceAuthed] = useState(false)

  useEffect(() => {
    setAuthed(isAuthenticated())
    setInvoiceAuthed(isInvoiceAuthenticated())
  }, [])

  useEffect(() => {
    if (authed || invoiceAuthed) {
      startInactivityTimer(() => router.push('/'))
      return () => stopInactivityTimer()
    }
  }, [authed, invoiceAuthed, router])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleInvoiceLogout = () => {
    invoiceLogout()
    router.push('/invoice')
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
                <>
                  <button onClick={handleLogout} className="btn-outline btn-sm">
                    Logout
                  </button>
                </>
              )}
              {invoiceAuthed && router.pathname === '/invoice' && (
                <button onClick={handleInvoiceLogout} className="btn-outline btn-sm">
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
