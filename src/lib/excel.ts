import * as XLSX from 'xlsx'
import { Product } from './types'

export async function fetchProducts(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_EXCEL_URL
  if (!url) {
    throw new Error('EXCEL_URL environment variable is not set')
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch Excel file: ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') || ''
  const isCsv = contentType.includes('text/csv') || url.includes('export?format=csv')

  let rows: Record<string, string | number>[]

  if (isCsv) {
    const text = await response.text()
    const workbook = XLSX.read(text, { type: 'string', raw: true })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, { raw: true })
  } else {
    const arrayBuffer = await response.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet)
  }

  const products: Product[] = rows.map((row) => ({
    name: String(row['Name'] || row['name'] || ''),
    description: String(row['Description'] || row['description'] || ''),
    rrp: parseFloat(String(row['RRP'] || row['rrp'] || row['Price'] || row['price'] || '0')),
    rdp: parseFloat(String(row['RDP'] || row['rdp'] || row['Price'] || row['price'] || '0')),
    sku: String(row['SKU'] || row['sku'] || row['Sku'] || '').trim(),
    barcode: String(row['Barcode'] || row['barcode'] || ''),
    stock: parseInt(String(row['Stock'] || row['stock'] || '0'), 10) || 0,
    imageUrls: parseImageUrls(
      String(row['ImageURLs'] || row['imageurls'] || row['ImageURL'] || row['imageUrl'] || '')
    ),
    category: String(row['Category'] || row['category'] || '').trim(),
    company: String(row['Company'] || row['company'] || '').trim(),
    nameAr: String(row['Name AR'] || row['name_ar'] || '').trim() || undefined,
    descriptionAr: String(row['Description AR'] || row['description_ar'] || '').trim() || undefined,
    categoryAr: String(row['Category AR'] || row['category_ar'] || '').trim() || undefined,
  }))

  return products.filter((p) => p.name)
}

function parseImageUrls(value: string): string[] {
  if (!value) return []
  return value
    .split(/[,;]/)
    .map((url) => url.trim())
    .filter((url) => url.length > 0)
}
