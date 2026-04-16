import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/user/AuthProvider'
import { StoreProvider } from '@/app/store/providers/StoreProvider'
import { Navbar } from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'MyShop',
  description: 'Интернет-магазин',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-gray-50 min-h-screen">
        <StoreProvider>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
          </AuthProvider>
        </StoreProvider>
      </body>
    </html>
  )
}
