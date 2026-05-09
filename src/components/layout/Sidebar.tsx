'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Lightbulb, LayoutDashboard, BookOpen, Brain, FileText,
  Tag, Settings, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/ideas', icon: Lightbulb, label: 'Caixa de Ideias' },
  { href: '/brainstorm', icon: Brain, label: 'Brainstorm' },
  { href: '/texts', icon: FileText, label: 'Biblioteca de Textos' },
  { href: '/categories', icon: Tag, label: 'Categorias' },
  { href: '/settings', icon: Settings, label: 'Configurações' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 bg-card border-r border-border transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-border', collapsed && 'justify-center px-2')}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gold-500/20 shrink-0">
          <Zap className="w-4 h-4 text-gold-400" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">Banco de Ideias</p>
            <p className="text-[10px] text-muted-foreground">Marketing Político</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                active
                  ? 'bg-gold-500/15 text-gold-400'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-gold-400' : 'group-hover:text-foreground')} />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
