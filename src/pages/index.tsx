import React, { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/router'
import {
  isAuthenticated,
  login,
  checkPassword,
  invoiceLogin,
  checkInvoicePassword,
} from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [catalogPassword, setCatalogPassword] = useState('')
  const [invoicePassword, setInvoicePassword] = useState('')
  const [catalogError, setCatalogError] = useState('')
  const [invoiceError, setInvoiceError] = useState('')
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [invoiceLoading, setInvoiceLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/brands')
    }
  }, [router])

  const handleCatalogSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setCatalogError('')
    setCatalogLoading(true)

    if (checkPassword(catalogPassword)) {
      login()
      router.replace('/brands')
    } else {
      setCatalogError('Incorrect password')
      setCatalogLoading(false)
    }
  }

  const handleInvoiceSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setInvoiceError('')
    setInvoiceLoading(true)

    if (checkInvoicePassword(invoicePassword)) {
      invoiceLogin()
      router.replace('/invoice')
    } else {
      setInvoiceError('Incorrect password')
      setInvoiceLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand-logos">
        <img src="/elbeshbeshy-logo.png" alt="Elbeshbeshy" className="login-logo-main" />
        <div className="login-logo-row">
          <img src="/argosta-logo-no-bg.png" alt="Argosta" className="login-logo-sub" />
          <img src="/master-elektron-logo-no-bg.png" alt="Master Elektron" className="login-logo-sub" />
        </div>
      </div>
      <div className="login-cards">
        <div className="login-card">
          <h1>Product Catalog</h1>
          <p>Browse products by brand</p>

          {catalogError && <div className="error-msg">{catalogError}</div>}

          <form onSubmit={handleCatalogSubmit} className="login-form">
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter catalog password"
                value={catalogPassword}
                onChange={(e) => setCatalogPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={catalogLoading}>
              {catalogLoading ? 'Checking...' : 'Access Catalog'}
            </button>
          </form>
        </div>

        <div className="login-card">
          <h1>Invoice Creator</h1>
          <p>Generate and download invoices</p>

          {invoiceError && <div className="error-msg">{invoiceError}</div>}

          <form onSubmit={handleInvoiceSubmit} className="login-form">
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter invoice password"
                value={invoicePassword}
                onChange={(e) => setInvoicePassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={invoiceLoading}>
              {invoiceLoading ? 'Checking...' : 'Access Invoice'}
            </button>
          </form>
        </div>
      </div>

      <a href="/dashboard" className="dashboard-home-btn">
        Dashboard
      </a>
    </div>
  )
}
