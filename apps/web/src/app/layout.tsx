import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Звони — быстрые видеозвонки',
  description: 'Быстрые видеозвонки без лишнего шума',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body className="min-h-screen bg-bg text-text">{children}</body>
    </html>
  )
}
