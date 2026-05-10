'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, FileText, LayoutGrid, List, Loader2, Lightbulb, Layers } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { TextCard } from '@/components/TextCard'
import { SearchBar } from '@/components/SearchBar'
import { FilterPanel } from '@/components/FilterPanel'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import type { Text, Category } from '@/types'

type TextWithIdea = Text & { idea?: { id: string; title: string } | null }

const TEXT_STATUS_OPTIONS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'revisar', label: 'Revisar' },
  { value: 'pronto', label: 'Pronto para Gravar' },
  { value: 'gravado', label: 'Gravado' },
  { value: 'publicado', label: 'Publicado' },
  { value: 'arquivado', label: 'Arquivado' },
]

export default function TextsPage() {
  const [texts, setTexts] = useState<TextWithIdea[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [groupBy, setGroupBy] = useState<'idea' | 'status'>('idea')

  // Read initial filters from URL (e.g., ?status=pronto, ?category=xxx)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const initial: Record<string, string> = {}
    for (const k of ['status', 'category', 'format']) {
      const v = params.get(k)
      if (v) initial[k] = v
    }
    if (Object.keys(initial).length) setFilters(initial)
    const q = params.get('q')
    if (q) setSearch(q)
  }, [])
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    const [textsRes, catsRes] = await Promise.all([
      supabase
        .from('texts')
        .select('*, category:categories(*), idea:ideas(id, title)')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ])
    if (textsRes.error) {
      toast({ title: 'Erro ao carregar textos', description: textsRes.error.message, variant: 'destructive' })
    } else {
      setTexts((textsRes.data ?? []) as TextWithIdea[])
    }
    if (catsRes.data) setCategories(catsRes.data)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    let result = texts
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.content?.toLowerCase().includes(q) ||
        t.category?.name.toLowerCase().includes(q)
      )
    }
    if (filters.category) result = result.filter(t => t.category_id === filters.category)
    if (filters.status) result = result.filter(t => t.status === filters.status)
    if (filters.format) result = result.filter(t => t.format === filters.format)
    return result
  }, [texts, search, filters])

  const handleCopy = async (text: TextWithIdea) => {
    await navigator.clipboard.writeText(text.content)
    toast({ title: 'Texto copiado!', variant: 'success' })
  }

  const handleDelete = async (text: TextWithIdea) => {
    if (!confirm('Excluir este texto?')) return
    const { error } = await supabase.from('texts').delete().eq('id', text.id)
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
      return
    }
    setTexts(prev => prev.filter(t => t.id !== text.id))
    toast({ title: 'Texto excluído', variant: 'success' })
  }

  const statusGroups = {
    pronto: filtered.filter(t => t.status === 'pronto'),
    rascunho: filtered.filter(t => t.status === 'rascunho' || t.status === 'revisar'),
    outros: filtered.filter(t => !['pronto', 'rascunho', 'revisar'].includes(t.status)),
  }

  // Group by idea, preserving original (most-recent-first) order
  const ideaGroups = useMemo(() => {
    const map = new Map<string, { id: string | null; title: string; texts: TextWithIdea[] }>()
    for (const t of filtered) {
      const key = t.idea?.id ?? '__orphan__'
      const title = t.idea?.title ?? 'Sem ideia vinculada'
      if (!map.has(key)) map.set(key, { id: t.idea?.id ?? null, title, texts: [] })
      map.get(key)!.texts.push(t)
    }
    return Array.from(map.values())
  }, [filtered])

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-gold-400" />
              Biblioteca de Textos
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">{texts.length} textos salvos</p>
          </div>
          <Button className="gap-2 self-start sm:self-auto" asChild>
            <Link href="/brainstorm">
              <Plus className="w-4 h-4" />
              Novo texto
            </Link>
          </Button>
        </div>

        <div className="space-y-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar textos..." />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <FilterPanel
              categories={categories}
              filters={filters}
              onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
              onClear={() => setFilters({})}
              showFormat
              statusOptions={TEXT_STATUS_OPTIONS}
            />
            <div className="flex items-center gap-1 ml-auto">
              <div className="flex items-center gap-0.5 mr-2 border border-border rounded-lg p-0.5">
                <Button
                  variant={groupBy === 'idea' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setGroupBy('idea')}
                  title="Agrupar por ideia"
                >
                  <Lightbulb className="w-3 h-3" />
                  Por ideia
                </Button>
                <Button
                  variant={groupBy === 'status' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setGroupBy('status')}
                  title="Agrupar por status"
                >
                  <Layers className="w-3 h-3" />
                  Por status
                </Button>
              </div>
              <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setView('grid')}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
              <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setView('list')}>
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{texts.length === 0 ? 'Nenhum texto salvo' : 'Nenhum resultado'}</p>
            <p className="text-sm mt-1">
              {texts.length === 0
                ? 'Crie uma ideia e use "Transformar com IA", ou faça um Brainstorm'
                : 'Ajuste os filtros'}
            </p>
          </div>
        ) : groupBy === 'idea' ? (
          <div className="space-y-8">
            {ideaGroups.map(group => (
              <section key={group.id ?? '__orphan__'}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-gold-400" />
                    {group.id ? (
                      <Link href={`/ideas/${group.id}`} className="hover:text-gold-400 transition-colors">
                        {group.title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{group.title}</span>
                    )}
                    <span className="text-xs text-muted-foreground font-normal">({group.texts.length})</span>
                  </h2>
                </div>
                <div className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                  {group.texts.map(t => <TextCard key={t.id} text={t} onCopy={handleCopy} onDelete={handleDelete} />)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {statusGroups.pronto.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  Prontos para Gravar ({statusGroups.pronto.length})
                </h2>
                <div className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                  {statusGroups.pronto.map(t => <TextCard key={t.id} text={t} onCopy={handleCopy} onDelete={handleDelete} />)}
                </div>
              </section>
            )}
            {statusGroups.rascunho.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />
                  Em Produção ({statusGroups.rascunho.length})
                </h2>
                <div className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                  {statusGroups.rascunho.map(t => <TextCard key={t.id} text={t} onCopy={handleCopy} onDelete={handleDelete} />)}
                </div>
              </section>
            )}
            {statusGroups.outros.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" />
                  Outros ({statusGroups.outros.length})
                </h2>
                <div className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                  {statusGroups.outros.map(t => <TextCard key={t.id} text={t} onCopy={handleCopy} onDelete={handleDelete} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
