'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { FloatingIdeaButton } from '@/components/FloatingIdeaButton'
import { Toaster } from '@/components/ui/toaster'

interface AppLayoutProps {
  children: React.ReactNode
  preCampaignMode?: boolean
}

export function AppLayout({ children, preCampaignMode }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header preCampaignMode={preCampaignMode} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
      <FloatingIdeaButton />
      <Toaster />
    </div>
  )
}
