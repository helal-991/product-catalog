import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { texts, target } = req.body
  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: 'Texts array required' })
  }

  const results: string[] = []

  for (const text of texts) {
    if (!text || typeof text !== 'string') {
      results.push('')
      continue
    }
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${target || 'ar'}`
      const response = await fetch(url)
      const data = await response.json()
      results.push(data.responseData?.translatedText || text)
    } catch {
      results.push(text)
    }
  }

  res.status(200).json({ translations: results })
}
