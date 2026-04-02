import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MyShop',
  description: 'Интернет-магазин',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-gray-50 min-h-screen">
        <main>{children}</main>
      </body>
    </html>
  )
}
