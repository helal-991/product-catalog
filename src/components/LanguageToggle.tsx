import React from 'react'
import { useLanguage } from '@/lib/i18n'

export default function LanguageToggle() {
  const { lang, toggleLang } = useLanguage()

  return (
    <button onClick={toggleLang} className="lang-toggle" title={lang === 'en' ? 'العربية' : 'English'}>
      {lang === 'en' ? 'AR' : 'EN'}
    </button>
  )
}
