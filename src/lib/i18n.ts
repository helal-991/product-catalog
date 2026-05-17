import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import en from '@/translations/en'
import ar from '@/translations/ar'

type Language = 'en' | 'ar'

interface TranslationContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string) => string
  toggleLang: () => void
  getText: (text: string, lang: Language) => string
  translateTexts: (texts: string[]) => Promise<Record<string, string>>
}

const translations: Record<Language, Record<string, string>> = { en, ar }

const CACHE_KEY = 'product_translations'

const Ctx = createContext<TranslationContextType>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
  toggleLang: () => {},
  getText: (t) => t,
  translateTexts: async () => ({}),
})

function getCachedTranslations(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function setCachedTranslations(map: Record<string, string>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CACHE_KEY, JSON.stringify(map))
}



export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en')
  const [translationCache, setTranslationCache] = useState<Record<string, string>>({})
  const [translating, setTranslating] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('lang') as Language | null
    if (saved === 'ar' || saved === 'en') {
      setLang(saved)
    }
    setTranslationCache(getCachedTranslations())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('lang', lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback(
    (key: string): string => {
      if (lang === 'en') return key
      const translated = translationCache[key]
      if (translated) return translated
      const staticAr = ar[key]
      if (staticAr) return staticAr
      return key
    },
    [lang, translationCache]
  )

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'))
  }, [])

  const getText = useCallback(
    (text: string, targetLang: Language): string => {
      if (targetLang === 'en') return text
      const cached = translationCache[text]
      if (cached) return cached
      const staticAr = ar[text]
      if (staticAr) return staticAr
      return text
    },
    [translationCache]
  )

  const translateTexts = useCallback(
    async (texts: string[]): Promise<Record<string, string>> => {
      const toTranslate = texts.filter((t) => t && !translationCache[t] && !ar[t])
      if (toTranslate.length === 0) return {}

      const newCache: Record<string, string> = {}
      const batchSize = 50

      for (let i = 0; i < toTranslate.length; i += batchSize) {
        const batch = toTranslate.slice(i, i + batchSize)
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: batch, target: 'ar' }),
          })
          const data = await res.json()
          if (data.translations) {
            batch.forEach((text, idx) => {
              if (data.translations[idx]) {
                newCache[text] = data.translations[idx]
              }
            })
          }
        } catch {}
      }

      const merged = { ...translationCache, ...newCache }
      setTranslationCache(merged)
      setCachedTranslations(merged)
      return newCache
    },
    [translationCache]
  )

  const provVal = { lang, setLang, t, toggleLang, getText, translateTexts }
  return React.createElement(Ctx.Provider, { value: provVal }, children)
}

export function useTranslation() {
  const ctx = useContext(Ctx)
  const translateProductData = useCallback(
    async (products: { name?: string; description?: string; category?: string }[]) => {
      const texts = new Set<string>()
      products.forEach((p) => {
        if (p.name) texts.add(p.name)
        if (p.description) texts.add(p.description)
        if (p.category) texts.add(p.category)
      })
      await ctx.translateTexts(Array.from(texts))
    },
    [ctx.translateTexts]
  )
  return { ...ctx, translateProductData }
}

export function useLanguage() {
  return useContext(Ctx)
}
