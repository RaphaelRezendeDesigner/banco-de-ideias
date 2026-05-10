'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Brain, ArrowRight, Lightbulb, TrendingUp, Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardStatsComponent } from '@/components/DashboardStats'
import { IdeaCard } from '@/components/IdeaCard'
import { SearchBar } from '@/components/SearchBar'
import { CategoryBadge } from '@/components/CategoryBadge'
import { createClient } from '@/lib/supabase/client'
import type { DashboardStats, Idea, Category } from '@/types'

export default function DashboardPage() {
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState<DashboardStats>({
    totalIdeas: 0,
    textsInProgress: 0,
    textsReady: 0,
    topCategories: [],
    recentIdeas: [],
  })
  const [recentIdeas, setRecentIdeas] = useState<Idea[]>([])
  const [topCategories, setTopCategories] = useState<{ category: Category; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) router.push(`/ideas?q=${encodeURIComponent(search.trim())}`)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    const [ideasRes, textsProgressRes, textsReadyRes, categoriesRes, recentRes] = await Promise.all([
      supabase.from('ideas').select('id', { count: 'exact', head: true }),
      supabase.from('texts').select('id', { count: 'exact', head: true }).in('status', ['rascunho', 'revisar']),
      supabase.from('texts').select('id', { count: 'exact', head: true }).eq('status', 'pronto'),
      supabase.from('categories').select('*').order('name'),
      supabase
        .from('ideas')
        .select('*, category:categories(*)')
        .order('created_at', { ascending: false })
        .limit(4),
    ])

    const cats = (categoriesRes.data ?? []) as Category[]
    setRecentIdeas((recentRes.data ?? []) as Idea[])

    // Compute top categories by counting recent ideas per category
    const allIdeasRes = await supabase.from('ideas').select('category_id')
    const counts = new Map<string, number>()
    for (const row of allIdeasRes.data ?? []) {
      if (row.category_id) counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1)
    }
    const top = cats
      .map(c => ({ category: c, count: counts.get(c.id) ?? 0 }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
    setTopCategories(top)

    setStats({
      totalIdeas: ideasRes.count ?? 0,
      textsInProgress: textsProgressRes.count ?? 0,
      textsReady: textsReadyRes.count ?? 0,
      topCategories: cats.map(c => ({ name: c.name, count: counts.get(c.id) ?? 0 })),
      recentIdeas: (recentRes.data ?? []) as Idea[],
    })
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Banco de Ideias</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Seu cérebro auxiliar de campanha e comunicação</p>
          </div>
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="w-64">
              <SearchBar value={search} onChange={setSearch} placeholder="Buscar..." />
            </form>
            <Button asChild className="gap-2">
              <Link href="/brainstorm">
                <Brain className="w-4 h-4" />
                Novo Brainstorm
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DashboardStatsComponent stats={stats} />

            <div className="grid lg:grid-cols-3 gap-6">
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

                {recentIdeas.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Nenhuma ideia ainda</p>
                      <p className="text-sm mt-1">Clique no 💡 flutuante ou em "Nova ideia"</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {recentIdeas.map(idea => (
                      <IdeaCard key={idea.id} idea={idea} />
                    ))}
                  </div>
                )}

                <Button variant="outline" className="w-full gap-2" asChild>
                  <Link href="/ideas">
                    <Plus className="w-4 h-4" />
                    Ver todas as ideias
                  </Link>
                </Button>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gold-400" />
                      Categorias Mais Usadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {topCategories.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Nenhuma categoria usada ainda
                      </p>
                    ) : (
                      topCategories.map(({ category, count }) => (
                        <Link
                          key={category.id}
                          href={`/ideas?category=${category.id}`}
                          className="flex items-center justify-between gap-2 py-1 hover:bg-muted/50 rounded-md px-1 transition-colors"
                        >
                          <CategoryBadge category={category} />
                          <span className="text-xs text-muted-foreground">{count}</span>
                        </Link>
                      ))
                    )}
                  </CardContent>
                </Card>

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
          </>
        )}
      </div>
    </AppLayout>
  )
}
