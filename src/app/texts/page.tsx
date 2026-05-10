'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, FileText, LayoutGrid, List, Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { TextCard } from '@/components/TextCard'
import { SearchBar } from '@/components/SearchBar'
import { FilterPanel } from '@/components/FilterPanel'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import type { Text, Category } from '@/types'

const TEXT_STATUS_OPTIONS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'revisar', label: 'Revisar' },
  { value: 'pronto', label: 'Pronto para Gravar' },
  { value: 'gravado', label: 'Gravado' },
  { value: 'publicado', label: 'Publicado' },
  { value: 'arquivado', label: 'Arquivado' },
]

export default function TextsPage() {
  const [texts, setTexts] = useState<Text[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [view, setView] = useState<'grid' | 'list'>('grid')
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
      supabase.from('texts').select('*, category:categories(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ])
    if (textsRes.error) {
      toast({ title: 'Erro ao carregar textos', description: textsRes.error.message, variant: 'destructive' })
    } else {
      setTexts((textsRes.data ?? []) as Text[])
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

  const handleCopy = async (text: Text) => {
    await navigator.clipboard.writeText(text.content)
    toast({ title: 'Texto copiado!', variant: 'success' })
  }

  const handleDelete = async (text: Text) => {
    if (!confirm('Excluir este texto?')) return
    const { error } = await supabase.from('texts').delete().eq('id', text.id)
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
      return
    }
    setTexts(prev => prev.filter(t => t.id !== text.id))
    toast({ title: 'Texto excluído', variant: 'success' })
  }

  const groups = {
    pronto: filtered.filter(t => t.status === 'pronto'),
    rascunho: filtered.filter(t => t.status === 'rascunho' || t.status === 'revisar'),
    outros: filtered.filter(t => !['pronto', 'rascunho', 'revisar'].includes(t.status)),
  }

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
        ) : (
          <div className="space-y-8">
            {groups.pronto.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  Prontos para Gravar ({groups.pronto.length})
                </h2>
                <div className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                  {groups.pronto.map(t => <TextCard key={t.id} text={t} onCopy={handleCopy} onDelete={handleDelete} />)}
                </div>
              </section>
            )}
            {groups.rascunho.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />
                  Em Produção ({groups.rascunho.length})
                </h2>
                <div className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                  {groups.rascunho.map(t => <TextCard key={t.id} text={t} onCopy={handleCopy} onDelete={handleDelete} />)}
                </div>
              </section>
            )}
            {groups.outros.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" />
                  Outros ({groups.outros.length})
                </h2>
                <div className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                  {groups.outros.map(t => <TextCard key={t.id} text={t} onCopy={handleCopy} onDelete={handleDelete} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
