import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Banco de Ideias — Marketing Político',
  description: 'Registre ideias, organize pensamentos e produza conteúdo político de impacto',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
