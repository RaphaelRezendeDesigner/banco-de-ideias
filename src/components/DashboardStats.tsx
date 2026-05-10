import Link from 'next/link'
import { Lightbulb, FileText, CheckCircle, Tag, ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { DashboardStats } from '@/types'

interface DashboardStatsProps {
  stats: DashboardStats
}

export function DashboardStatsComponent({ stats }: DashboardStatsProps) {
  const items = [
    {
      label: 'Total de Ideias',
      value: stats.totalIdeas,
      icon: Lightbulb,
      color: 'text-gold-400',
      bg: 'bg-gold-500/10',
      href: '/ideas',
    },
    {
      label: 'Textos em Produção',
      value: stats.textsInProgress,
      icon: FileText,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      href: '/texts?status=rascunho',
    },
    {
      label: 'Prontos para Gravar',
      value: stats.textsReady,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      href: '/texts?status=pronto',
    },
    {
      label: 'Categorias',
      value: stats.topCategories.length,
      icon: Tag,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      href: '/categories',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(({ label, value, icon: Icon, color, bg, href }) => (
        <Link key={label} href={href} className="group block">
          <Card className="h-full transition-all hover:border-gold-500/30 hover:shadow-md hover:shadow-gold-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
