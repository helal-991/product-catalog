import React, { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/router'
import { login, isAuthenticated, startInactivityTimer, stopInactivityTimer } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    isAuthenticated().then((authed) => {
      if (authed) {
        startInactivityTimer(() => router.replace('/'))
        router.replace('/brands')
      } else {
        setChecking(false)
      }
    })
  }, [router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = await login(password)
    if (ok) {
      startInactivityTimer(() => router.replace('/'))
      router.replace('/brands')
    } else {
      setError('Incorrect password')
      setLoading(false)
    }
  }

  if (checking) {
    return <div className="loading">Loading...</div>
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

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter catalog password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Checking...' : 'Access Catalog'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
