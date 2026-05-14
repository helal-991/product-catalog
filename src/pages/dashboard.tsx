import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  isDashboardAuthenticated,
  dashboardLogin,
  dashboardLogout,
  checkDashboardPassword,
} from '@/lib/auth'
import { Product } from '@/lib/types'
import { Order } from '@/lib/orders'

type Tab = 'orders' | 'stock'

const brandNames: Record<string, string> = {
  'master-elektron': 'Master Elektron',
  'argosta': 'Argosta',
}

export default function DashboardPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [tab, setTab] = useState<Tab>('orders')

  // orders
  const [orders, setOrders] = useState<Order[]>([])
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [ordersLoading, setOrdersLoading] = useState(false)

  // stock
  const [products, setProducts] = useState<Product[]>([])
  const [selectedBrand, setSelectedBrand] = useState('')
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({})
  const [stockUpdating, setStockUpdating] = useState<Record<string, boolean>>({})
  const [stockMsg, setStockMsg] = useState('')
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    setAuthed(isDashboardAuthenticated())
  }, [])

  useEffect(() => {
    if (!authed) return
    if (tab === 'orders') {
      loadOrders()
    }
    if (tab === 'stock') {
      loadProducts()
    }
  }, [authed, tab])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (checkDashboardPassword(password)) {
      dashboardLogin()
      setAuthed(true)
      setPasswordError('')
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

  const loadProducts = async () => {
    setDataLoading(true)
    try {
      const res = await fetch('/api/products?includeStock=true')
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch {} finally {
      setDataLoading(false)
    }
  }

  const brandProducts = selectedBrand
    ? products.filter((p) => p.company.toLowerCase() === selectedBrand.toLowerCase())
    : []

  const handleStockUpdate = async (sku: string) => {
    const val = parseInt(stockInputs[sku], 10)
    if (isNaN(val) || val < 0) return
    setStockUpdating((prev) => ({ ...prev, [sku]: true }))
    setStockMsg('')
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, stock: val }),
      })
      const result = await res.json()
      if (result.success) {
        setStockMsg(`Updated ${sku} to ${val}`)
        loadProducts()
        setStockInputs((prev) => {
          const next = { ...prev }
          delete next[sku]
          return next
        })
      } else {
        setStockMsg(result.error || 'Failed to update')
      }
    } catch {
      setStockMsg('Failed to update')
    } finally {
      setStockUpdating((prev) => ({ ...prev, [sku]: false }))
    }
  }

  const handleLogout = () => {
    dashboardLogout()
    setAuthed(false)
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

      <div className="category-filters" style={{ marginBottom: 24 }}>
        <button
          className={`category-chip ${tab === 'orders' ? 'active' : ''}`}
          onClick={() => setTab('orders')}
        >
          Orders
        </button>
        <button
          className={`category-chip ${tab === 'stock' ? 'active' : ''}`}
          onClick={() => setTab('stock')}
        >
          Stock
        </button>
      </div>

      {tab === 'orders' && (
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
                          <button
                            onClick={() =>
                              setExpandedOrder(expandedOrder === order.id ? null : order.id)
                            }
                            className="btn btn-sm btn-outline"
                            style={{ width: 'auto', padding: '4px 12px', fontSize: '0.8rem' }}
                          >
                            {expandedOrder === order.id ? 'Hide' : 'View'}
                          </button>
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
      )}

      {tab === 'stock' && (
        <section className="invoice-section">
          <h2>Stock Management</h2>

          <div className="invoice-brand-grid" style={{ marginBottom: 24 }}>
            {Object.values(brandNames).map((brand) => (
              <button
                key={brand}
                className={`invoice-brand-card ${selectedBrand === brand ? 'active' : ''}`}
                onClick={() => setSelectedBrand(selectedBrand === brand ? '' : brand)}
              >
                {brand}
              </button>
            ))}
          </div>

          {stockMsg && (
            <div className="error-msg" style={{ marginBottom: 16, color: stockMsg.includes('Updated') ? '#16a34a' : '#dc2626', background: stockMsg.includes('Updated') ? '#f0fdf4' : undefined }}>
              {stockMsg}
            </div>
          )}

          {!selectedBrand ? (
            <p style={{ color: '#64748b', padding: 24, textAlign: 'center' }}>Select a brand above to view and update stock.</p>
          ) : dataLoading ? (
            <div className="loading">Loading stock data...</div>
          ) : brandProducts.length === 0 ? (
            <p style={{ color: '#64748b', padding: 24, textAlign: 'center' }}>No products found for this brand.</p>
          ) : (
            <div className="invoice-table-wrap">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Current Stock</th>
                    <th>New Stock</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {brandProducts.map((p) => {
                    const id = p.sku || p.name
                    return (
                      <tr key={id}>
                        <td>{p.sku || '-'}</td>
                        <td>{p.name}</td>
                        <td style={{ fontWeight: 700 }}>{p.stock}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={stockInputs[id] ?? ''}
                            onChange={(e) =>
                              setStockInputs((prev) => ({ ...prev, [id]: e.target.value }))
                            }
                            className="invoice-qty-input"
                            style={{ width: 80 }}
                            placeholder="New value"
                          />
                        </td>
                        <td>
                          <button
                            onClick={() => handleStockUpdate(id)}
                            disabled={stockUpdating[id] || !stockInputs[id]}
                            className="btn btn-sm btn-primary"
                            style={{ width: 'auto', padding: '6px 16px', fontSize: '0.85rem' }}
                          >
                            {stockUpdating[id] ? '...' : 'Update'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
