'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Brain, ArrowRight, Lightbulb, TrendingUp } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardStatsComponent } from '@/components/DashboardStats'
import { IdeaCard } from '@/components/IdeaCard'
import { SearchBar } from '@/components/SearchBar'
import { CategoryBadge } from '@/components/CategoryBadge'
import type { DashboardStats, Idea } from '@/types'
import { MOCK_IDEAS, MOCK_CATEGORIES } from '@/lib/mock-data'

const MOCK_STATS: DashboardStats = {
  totalIdeas: 5,
  textsInProgress: 2,
  textsReady: 1,
  topCategories: [
    { name: 'Desenvolvimento do Amazonas', count: 2 },
    { name: 'BR-319', count: 1 },
    { name: 'Interior do Amazonas', count: 1 },
  ],
  recentIdeas: MOCK_IDEAS.slice(0, 3),
}

export default function DashboardPage() {
  const [search, setSearch] = useState('')
  const [stats] = useState<DashboardStats>(MOCK_STATS)
  const [recentIdeas] = useState<Idea[]>(MOCK_IDEAS.slice(0, 4))

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Banco de Ideias</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Seu cérebro auxiliar de campanha e comunicação</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-64">
              <SearchBar value={search} onChange={setSearch} placeholder="Buscar..." />
            </div>
            <Button asChild className="gap-2">
              <Link href="/brainstorm">
                <Brain className="w-4 h-4" />
                Novo Brainstorm
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <DashboardStatsComponent stats={stats} />

        {/* Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent ideas */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-gold-400" />
                Últimas Ideias
              </h2>
              <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
                <Link href="/ideas">Ver todas <ArrowRight className="w-3 h-3" /></Link>
              </Button>
            </div>

            <div className="space-y-3">
              {recentIdeas.map(idea => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>

            <Button variant="outline" className="w-full gap-2" asChild>
              <Link href="/ideas">
                <Plus className="w-4 h-4" />
                Ver todas as ideias
              </Link>
            </Button>
          </div>

          {/* Sidebar widgets */}
          <div className="space-y-4">
            {/* Top categories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gold-400" />
                  Categorias Mais Usadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.topCategories.map(({ name, count }) => {
                  const cat = MOCK_CATEGORIES.find(c => c.name === name)
                  return (
                    <div key={name} className="flex items-center justify-between gap-2">
                      {cat ? (
                        <CategoryBadge category={cat} />
                      ) : (
                        <span className="text-sm text-muted-foreground">{name}</span>
                      )}
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { href: '/brainstorm', label: 'Iniciar brainstorm', icon: Brain },
                  { href: '/ideas', label: 'Ver caixa de ideias', icon: Lightbulb },
                  { href: '/texts', label: 'Biblioteca de textos', icon: ArrowRight },
                ].map(({ href, label, icon: Icon }) => (
                  <Button key={href} variant="ghost" className="w-full justify-start gap-2 text-sm h-9" asChild>
                    <Link href={href}>
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      {label}
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Brainstorm CTA */}
            <div className="rounded-xl bg-gradient-to-br from-gold-500/10 to-gold-600/5 border border-gold-500/20 p-4">
              <h3 className="font-semibold text-sm mb-1">Comece um novo brainstorm</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Organize seus pensamentos antes de virar texto.
              </p>
              <Button size="sm" className="w-full gap-2" asChild>
                <Link href="/brainstorm">
                  <Brain className="w-4 h-4" />
                  Ir para Brainstorm
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
