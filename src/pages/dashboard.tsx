import React, { useEffect, useState } from 'react'
import { isAuthenticated, login as authLogin, logout as authLogout, startInactivityTimer, stopInactivityTimer } from '@/lib/auth'
import { Order } from '@/lib/orders'

export default function DashboardPage() {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [orders, setOrders] = useState<Order[]>([])
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [ordersLoading, setOrdersLoading] = useState(false)

  useEffect(() => {
    isAuthenticated('dashboard').then((ok) => {
      setAuthed(ok)
      setChecking(false)
      if (ok) {
        startInactivityTimer(() => location.reload())
        loadOrders()
      }
    })
    return () => stopInactivityTimer()
  }, [])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await authLogin('dashboard', password)
    if (ok) {
      setAuthed(true)
      setPasswordError('')
      startInactivityTimer(() => location.reload())
      loadOrders()
    } else {
      setPasswordError('Incorrect password')
    }
  }

  const loadOrders = async () => {
    setOrdersLoading(true)
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch {} finally {
      setOrdersLoading(false)
    }
  }

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm(`Delete order ${id}?`)) return
    try {
      await fetch(`/api/orders?orderId=${id}`, { method: 'DELETE' })
      setOrders((prev) => prev.filter((o) => o.id !== id))
      if (expandedOrder === id) setExpandedOrder(null)
    } catch {}
  }

  const handleLogout = () => {
    stopInactivityTimer()
    authLogout('dashboard').then(() => setAuthed(false))
  }

  if (checking) {
    return <div className="loading">Loading...</div>
  }

  if (!authed) {
    return (
      <div className="invoice-page">
        <div className="invoice-card">
          <h1>Dashboard</h1>
          <p>Enter the dashboard password to continue</p>
          <form onSubmit={handlePasswordSubmit} className="invoice-login-form">
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter dashboard password"
                autoFocus
              />
            </div>
            {passwordError && <div className="error-msg">{passwordError}</div>}
            <button type="submit" className="btn btn-primary">
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="invoice-page">
      <div className="invoice-header-bar">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="btn btn-sm btn-outline" style={{ width: 'auto' }}>
          Logout
        </button>
      </div>

      <section className="invoice-section">
        <h2>Order History</h2>
        {ordersLoading ? (
          <div className="loading">Loading orders...</div>
        ) : orders.length === 0 ? (
          <p style={{ color: '#64748b', padding: 24, textAlign: 'center' }}>No orders yet.</p>
        ) : (
          <div className="invoice-table-wrap">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Buyer</th>
                  <th>Items</th>
                  <th>Grand Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr>
                      <td>{order.date}</td>
                      <td>{order.supplier}</td>
                      <td>{order.companyName}</td>
                      <td>{order.items.reduce((s, i) => s + i.qty, 0)} units</td>
                      <td style={{ fontWeight: 700 }}>
                        {order.grandTotal.toLocaleString('en-US')} EGP
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() =>
                              setExpandedOrder(expandedOrder === order.id ? null : order.id)
                            }
                            className="btn btn-sm btn-outline"
                            style={{ width: 'auto', padding: '4px 12px', fontSize: '0.8rem' }}
                          >
                            {expandedOrder === order.id ? 'Hide' : 'View'}
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="btn btn-sm btn-outline"
                            style={{ width: 'auto', padding: '4px 12px', fontSize: '0.8rem', color: '#dc2626', borderColor: '#dc2626' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedOrder === order.id && (
                      <tr>
                        <td colSpan={6} style={{ padding: '0 12px 12px' }}>
                          <table style={{ width: '100%', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ color: '#64748b' }}>
                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>SKU</th>
                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Product</th>
                                <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Qty</th>
                                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Unit Price</th>
                                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item) => (
                                <tr key={item.sku}>
                                  <td style={{ padding: '6px 8px' }}>{item.sku}</td>
                                  <td style={{ padding: '6px 8px' }}>{item.name}</td>
                                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>{item.qty}</td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                                    {item.unitPrice.toLocaleString('en-US')} EGP
                                  </td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                                    {(item.qty * item.unitPrice).toLocaleString('en-US')} EGP
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {order.paymentPlan && (
                            <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
                              <strong>Payment: {order.paymentPlan}</strong>
                              {order.paymentPlan === 'Payments' && order.paymentDates?.length > 0 && (
                                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  {order.paymentDates.map((d, i) => {
                                    const amt = order.paymentAmounts?.[i] || 0
                                    return (
                                      <div key={i} style={{ fontSize: '0.85rem', color: '#334155' }}>
                                        {d} — {amt.toLocaleString('en-US')} EGP
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
