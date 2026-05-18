import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import ar from '@/translations/ar'

type Language = 'en' | 'ar'

interface TranslationContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string) => string
  toggleLang: () => void
}

const Ctx = createContext<TranslationContextType>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
  toggleLang: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('lang') as Language | null
    if (saved === 'ar' || saved === 'en') {
      setLang(saved)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('lang', lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback((key: string): string => {
    if (lang === 'en') return key
    return ar[key] || key
  }, [lang])

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'))
  }, [])

  const provVal = { lang, setLang, t, toggleLang }
  return React.createElement(Ctx.Provider, { value: provVal }, children)
}

export function useLanguage() {
  return useContext(Ctx)
}
