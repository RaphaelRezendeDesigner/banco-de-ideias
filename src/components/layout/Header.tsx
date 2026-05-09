'use client'

import { Search, Bell, Menu, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface HeaderProps {
  preCampaignMode?: boolean
}

export function Header({ preCampaignMode }: HeaderProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/ideas?q=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center gap-4 px-4 md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden">
        <Menu className="w-4 h-4" />
      </Button>

      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar ideias, textos, categorias..."
            className="pl-9 h-8 text-sm bg-muted border-0 focus-visible:ring-1"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        {preCampaignMode && (
          <Badge variant="warning" className="gap-1 hidden sm:flex">
            <ShieldAlert className="w-3 h-3" />
            Modo Pré-Campanha
          </Badge>
        )}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
