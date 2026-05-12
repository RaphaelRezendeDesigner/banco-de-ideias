'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Lightbulb, LayoutDashboard, BookOpen, Brain, FileText,
  Tag, Settings, ChevronLeft, ChevronRight, Zap, X, Megaphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/ideas', icon: Lightbulb, label: 'Caixa de Ideias' },
  { href: '/brainstorm', icon: Brain, label: 'Brainstorm' },
  { href: '/texts', icon: FileText, label: 'Biblioteca de Textos' },
  { href: '/categories', icon: Tag, label: 'Categorias' },
  { href: '/voice', icon: Megaphone, label: 'Voz do Candidato' },
  { href: '/settings', icon: Settings, label: 'Configurações' },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Close mobile drawer on route change
  useEffect(() => {
    if (mobileOpen) onMobileClose?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'flex flex-col h-screen bg-card border-r border-border shrink-0 transition-all duration-300',
          // Desktop: sticky inline
          'md:sticky md:top-0 md:flex',
          collapsed ? 'md:w-16' : 'md:w-60',
          // Mobile: fixed slide-in drawer
          'fixed top-0 left-0 z-50 w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-border', collapsed && 'md:justify-center md:px-2')}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gold-500/20 shrink-0">
            <Zap className="w-4 h-4 text-gold-400" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className={cn('flex-1', collapsed && 'md:hidden')}>
              <p className="text-sm font-bold text-foreground leading-tight">Banco de Ideias</p>
              <p className="text-[10px] text-muted-foreground">Marketing Político</p>
            </div>
          )}
          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            className="md:hidden p-1 rounded text-muted-foreground hover:text-foreground"
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  active
                    ? 'bg-gold-500/15 text-gold-400'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'md:justify-center md:px-2',
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-gold-400' : 'group-hover:text-foreground')} />
                <span className={cn(collapsed && 'md:hidden')}>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="p-2 border-t border-border hidden md:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  )
}
