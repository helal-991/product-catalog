import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface InvoiceItem {
  sku: string
  name: string
  qty: number
  unitPrice: number
  priceType: 'RRP' | 'RDP'
}

export interface InvoiceData {
  companyName: string
  companyLocation: string
  paymentPlan: 'Cash' | 'Payments'
  paymentDates: string[]
  paymentAmounts: number[]
  supplier: string
  items: InvoiceItem[]
  date: string
}

export function generateInvoicePDF(data: InvoiceData): { blob: Blob; filename: string } {
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.text('INVOICE', 14, 22)
  doc.setFontSize(10)
  doc.text(`Date: ${data.date}`, 14, 30)

  let y = 42

  doc.setFontSize(12)
  doc.text('Buyer Information', 14, y)
  y += 8
  doc.setFontSize(10)
  doc.text(`Company: ${data.companyName}`, 14, y)
  y += 6
  doc.text(`Location: ${data.companyLocation}`, 14, y)
  y += 6
  doc.text(`Payment Plan: ${data.paymentPlan}`, 14, y)
  y += 8

  if (data.paymentPlan === 'Payments' && data.paymentDates.length > 0) {
    doc.text('Payment Dates:', 14, y)
    y += 6
    data.paymentDates.forEach((date, i) => {
      const amt = data.paymentAmounts?.[i] || 0
      doc.text(`  ${date}  —  ${amt.toLocaleString('en-US')} EGP`, 14, y)
      y += 6
    })
  }

  doc.text(`Supplier: ${data.supplier}`, 14, y)
  y += 8

  const tableColumn = ['#', 'SKU', 'Description', 'Qty', 'Unit Price', 'Total']
  const tableRows: (string | number)[][] = data.items.map((item, i) => [
    i + 1,
    item.sku,
    item.name,
    item.qty,
    `${item.priceType} ${item.unitPrice.toLocaleString('en-US')} EGP`,
    (item.qty * item.unitPrice).toLocaleString('en-US') + ' EGP',
  ])

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [89, 6, 150] },
    styles: { fontSize: 9 },
    foot: [['', '', '', '', 'Grand Total', data.items.reduce((s, i) => s + i.qty * i.unitPrice, 0).toLocaleString('en-US') + ' EGP']],
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
  })

  const filename = `invoice-${data.companyName.replace(/\s+/g, '-')}-${data.date.replace(/\//g, '-')}.pdf`
  const blob = doc.output('blob')
  return { blob, filename }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 1000)
}


