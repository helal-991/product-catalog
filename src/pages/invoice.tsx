import React, { useEffect, useState } from 'react'
import {
  isInvoiceAuthenticated,
  invoiceLogin,
  invoiceLogout,
  checkInvoicePassword,
} from '@/lib/auth'
import { Product } from '@/lib/types'
import { generateInvoicePDF, downloadBlob, InvoiceItem } from '@/lib/invoice'

export default function InvoicePage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [companyName, setCompanyName] = useState('')
  const [companyLocation, setCompanyLocation] = useState('')
  const [paymentPlan, setPaymentPlan] = useState<'Cash' | 'Payments'>('Cash')
  const [paymentDates, setPaymentDates] = useState<string[]>(['', '', '', '', ''])

  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedSku, setSelectedSku] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [generating, setGenerating] = useState(false)
  const [stockError, setStockError] = useState('')

  const [pdfResult, setPdfResult] = useState<{ blob: Blob; filename: string } | null>(null)

  useEffect(() => {
    setAuthed(isInvoiceAuthenticated())
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?includeStock=true')
      const data: Product[] = await res.json()
      setProducts(data)
      const unique = Array.from(new Set(data.map((p) => p.company).filter(Boolean)))
      setBrands(unique)
    } catch {}
  }

  const getStockForSku = (sku: string): number => {
    const p = products.find((p) => (p.sku || p.name) === sku)
    return p?.stock ?? 0
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (checkInvoicePassword(password)) {
      invoiceLogin()
      setAuthed(true)
      setPasswordError('')
    } else {
      setPasswordError('Incorrect password')
    }
  }

  const handleBrandSelect = (brand: string) => {
    const newBrand = selectedBrand === brand ? '' : brand
    setSelectedBrand(newBrand)
    setSelectedSku('')
    setItems([])
    setPdfResult(null)
    setStockError('')
  }

  const brandProducts = selectedBrand
    ? products.filter((p) => p.company.toLowerCase() === selectedBrand.toLowerCase())
    : []

  const handleAddItem = () => {
    if (!selectedSku) return
    const product = brandProducts.find(
      (p) => (p.sku || p.name).toLowerCase() === selectedSku.toLowerCase()
    )
    if (!product) return
    const existing = items.find((i) => i.sku === (product.sku || product.name))
    if (existing) {
      setItems(
        items.map((i) =>
          i.sku === (product.sku || product.name) ? { ...i, qty: i.qty + 1 } : i
        )
      )
    } else {
      setItems([
        ...items,
        {
          sku: product.sku || product.name,
          name: product.name,
          qty: 1,
          unitPrice: product.rdp,
          priceType: 'RDP',
        },
      ])
    }
    setSelectedSku('')
    setPdfResult(null)
    setStockError('')
  }

  const updateItemQty = (sku: string, qty: number) => {
    setItems(items.map((i) => (i.sku === sku ? { ...i, qty: Math.max(1, qty) } : i)))
    setStockError('')
  }

  const updateItemPriceType = (sku: string, priceType: 'RRP' | 'RDP') => {
    const product = brandProducts.find(
      (p) => (p.sku || p.name) === sku
    )
    if (!product) return
    const unitPrice = priceType === 'RRP' ? product.rrp : product.rdp
    setItems(items.map((i) => (i.sku === sku ? { ...i, priceType, unitPrice } : i)))
  }

  const removeItem = (sku: string) => {
    setItems(items.filter((i) => i.sku !== sku))
    setStockError('')
  }

  const grandTotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0)

  const handleCreateInvoice = async () => {
    setGenerating(true)
    setStockError('')
    try {
      const deductItems = items.map((i) => ({ sku: i.sku, qty: i.qty }))
      const deductRes = await fetch('/api/deduct-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: deductItems }),
      })
      const deductResult = await deductRes.json()

      if (!deductResult.success) {
        setStockError(deductResult.errors.join('\n'))
        setGenerating(false)
        return
      }

      const useDates = paymentPlan === 'Payments' ? paymentDates.filter(Boolean) : []
      const result = generateInvoicePDF({
        companyName: companyName || '(not provided)',
        companyLocation: companyLocation || '(not provided)',
        paymentPlan,
        paymentDates: useDates,
        supplier: selectedBrand,
        items,
        date: new Date().toLocaleDateString('en-GB'),
      })
      setPdfResult(result)

      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `INV-${Date.now()}`,
            date: new Date().toLocaleDateString('en-GB'),
            supplier: selectedBrand,
            companyName: companyName || '(not provided)',
            items,
            grandTotal,
          }),
        })
      } catch {} // order save is non-critical
    } catch (e: any) {
      alert('Failed to create invoice: ' + (e.message || e))
    } finally {
      setGenerating(false)
    }
  }

  const handleShareWhatsApp = async () => {
    if (!pdfResult) return
    const file = new File([pdfResult.blob], pdfResult.filename, { type: 'application/pdf' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: pdfResult.filename,
        })
        return
      } catch {}
    }
    downloadBlob(pdfResult.blob, pdfResult.filename)
  }

  const handleDownload = () => {
    if (!pdfResult) return
    downloadBlob(pdfResult.blob, pdfResult.filename)
  }

  const handleBack = () => {
    setPdfResult(null)
    fetchProducts()
  }

  const handlePaymentDateChange = (index: number, value: string) => {
    const updated = [...paymentDates]
    updated[index] = value
    setPaymentDates(updated)
  }

  const handleLogout = () => {
    invoiceLogout()
    setAuthed(false)
  }

  if (!authed) {
    return (
      <div className="invoice-page">
        <div className="invoice-card">
          <h1>Invoice Portal</h1>
          <p>Enter the invoice password to continue</p>
          <form onSubmit={handlePasswordSubmit} className="invoice-login-form">
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter invoice password"
                autoFocus
              />
            </div>
            {passwordError && <div className="error-msg">{passwordError}</div>}
            <button type="submit" className="btn btn-primary">
              Access Invoice
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="invoice-page">
      <div className="invoice-header-bar">
        <h1>Create Invoice</h1>
      </div>

      {!pdfResult ? (
        <>
          <section className="invoice-section">
            <h2>Buyer Information</h2>
            <div className="invoice-fields">
              <div className="input-group">
                <label>Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <div className="input-group">
                <label>Company Location</label>
                <input
                  type="text"
                  value={companyLocation}
                  onChange={(e) => setCompanyLocation(e.target.value)}
                  placeholder="Enter company location"
                />
              </div>
              <div className="input-group">
                <label>Payment Plan</label>
                <select value={paymentPlan} onChange={(e) => setPaymentPlan(e.target.value as 'Cash' | 'Payments')}>
                  <option value="Cash">Cash</option>
                  <option value="Payments">Payments</option>
                </select>
              </div>
              {paymentPlan === 'Payments' && (
                <div className="invoice-payment-dates">
                  <label>Payment Dates</label>
                  {paymentDates.map((date, i) => (
                    <input
                      key={i}
                      type="date"
                      value={date}
                      onChange={(e) => handlePaymentDateChange(i, e.target.value)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="invoice-section">
            <h2>Select Supplier</h2>
            <div className="invoice-brand-grid">
              {brands.map((brand) => (
                <button
                  key={brand}
                  className={`invoice-brand-card ${selectedBrand === brand ? 'active' : ''}`}
                  onClick={() => handleBrandSelect(brand)}
                >
                  {brand}
                </button>
              ))}
            </div>
          </section>

          {selectedBrand && (
            <>
              <section className="invoice-section">
                <h2>Stock Overview</h2>
                <div className="invoice-table-wrap">
                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Available Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brandProducts.map((p) => (
                        <tr key={p.sku || p.name}>
                          <td>{p.sku || '-'}</td>
                          <td>{p.name}</td>
                          <td style={{ fontWeight: 700 }}>{p.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="invoice-section">
                <h2>Add Products</h2>
                <div className="invoice-add-row">
                  <div className="input-group">
                    <label>Select Product</label>
                    <select value={selectedSku} onChange={(e) => {
                      setSelectedSku(e.target.value)
                      setStockError('')
                    }}>
                      <option value="">-- Choose SKU --</option>
                      {brandProducts.map((p) => (
                        <option key={p.sku || p.name} value={p.sku || p.name}>
                          {p.sku || p.name} – {p.name} (Stock: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button onClick={handleAddItem} className="btn btn-primary" style={{ marginTop: 22, width: 'auto', padding: '12px 32px' }}>
                    Add
                  </button>
                </div>
              </section>
            </>
          )}

          {items.length > 0 && (
            <section className="invoice-section">
              <h2>Invoice Items</h2>
              <div className="invoice-table-wrap">
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>SKU</th>
                      <th>Product Name</th>
                      <th>Stock</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => {
                      const stock = getStockForSku(item.sku)
                      const lowStock = item.qty > stock
                      return (
                        <tr key={item.sku}>
                          <td>{i + 1}</td>
                          <td>{item.sku}</td>
                          <td>{item.name}</td>
                          <td style={lowStock ? { color: '#dc2626', fontWeight: 700 } : undefined}>
                            {stock}
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => updateItemQty(item.sku, parseInt(e.target.value) || 1)}
                              className="invoice-qty-input"
                            />
                          </td>
                          <td>
                            <select
                              value={item.priceType}
                              onChange={(e) => updateItemPriceType(item.sku, e.target.value as 'RRP' | 'RDP')}
                              className="invoice-price-select"
                            >
                              <option value="RRP">RRP</option>
                              <option value="RDP">RDP</option>
                            </select>
                          </td>
                          <td>{item.unitPrice.toLocaleString('en-US')} EGP</td>
                          <td>{(item.qty * item.unitPrice).toLocaleString('en-US')} EGP</td>
                          <td>
                            <button onClick={() => removeItem(item.sku)} className="invoice-remove-btn">x</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'right', fontWeight: 700 }}>Grand Total</td>
                      <td style={{ fontWeight: 700 }}>{grandTotal.toLocaleString('en-US')} EGP</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {stockError && (
                <div className="error-msg" style={{ whiteSpace: 'pre-line', marginTop: 16 }}>
                  {stockError}
                </div>
              )}
              <button
                onClick={handleCreateInvoice}
                disabled={generating}
                className="btn btn-primary"
                style={{ marginTop: 24, padding: '14px 48px', fontSize: '1.1rem' }}
              >
                {generating ? 'Generating...' : 'Create Invoice'}
              </button>
            </section>
          )}
        </>
      ) : (
        <section className="invoice-section invoice-done-section">
          <h2>Invoice Created</h2>
          <p className="invoice-done-text">Your invoice has been generated successfully.</p>
          <div className="invoice-actions">
            <button onClick={handleShareWhatsApp} className="invoice-action-btn invoice-whatsapp-btn">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>WhatsApp</span>
            </button>
            <button onClick={handleDownload} className="invoice-action-btn invoice-download-btn">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              <span>Download PDF</span>
            </button>
          </div>
          <button onClick={handleBack} className="btn-outline" style={{ marginTop: 20, padding: '10px 32px' }}>
            Back to Edit
          </button>
        </section>
      )}
    </div>
  )
}
