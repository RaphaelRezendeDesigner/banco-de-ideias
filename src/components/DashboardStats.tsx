import { Lightbulb, FileText, CheckCircle, TrendingUp } from 'lucide-react'
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
    },
    {
      label: 'Textos em Produção',
      value: stats.textsInProgress,
      icon: FileText,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Prontos para Gravar',
      value: stats.textsReady,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Categorias Ativas',
      value: stats.topCategories.length,
      icon: TrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
