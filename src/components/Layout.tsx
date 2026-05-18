import React, { ReactNode } from 'react'
import { useRouter } from 'next/router'
import { useLanguage } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const { t, lang } = useLanguage()

  const showHeader = router.pathname !== '/'

  return (
    <div className={`layout ${lang === 'ar' ? 'rtl-layout' : ''}`}>
      {showHeader && (
        <header className="header">
          <div className="header-inner">
            <a href="/brands" className="logo">
              <img src="/elbeshbeshy-logo.png" alt="Elbeshbeshy" className="logo-img" />
              <span>{t('Product Catalog')}</span>
            </a>
            <div className="header-right">
              <LanguageToggle />
            </div>
          </div>
        </header>
      )}
      <main className="main">{children}</main>
    </div>
  )
}
