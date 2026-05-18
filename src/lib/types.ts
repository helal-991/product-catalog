export interface Product {
  name: string
  description: string
  rrp: number
  rdp: number
  sku: string
  barcode: string
  imageUrls: string[]
  category: string
  company: string
  stock: number
  nameAr?: string
  descriptionAr?: string
  categoryAr?: string
}

export function fmtPrice(price: number): string {
  return Math.round(price).toLocaleString('en-US')
}

export const brandColor: Record<string, string> = {
  'master-elektron': '#590696',
  'argosta': '#004a52',
}

export function brandSlug(company: string): string {
  return company.toLowerCase().replace(/\s+/g, '-')
}

export function brandClass(company: string): string {
  const slug = brandSlug(company)
  return brandColor[slug] ? `brand-${slug}` : ''
}
