'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Lightbulb, LayoutGrid, List, Loader2, Sparkles } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { IdeaCard } from '@/components/IdeaCard'
import { SearchBar } from '@/components/SearchBar'
import { FilterPanel } from '@/components/FilterPanel'
import { IdeaQuickDialog } from '@/components/IdeaQuickDialog'
import { TransformIdeaDialog } from '@/components/TransformIdeaDialog'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import type { Idea, Category } from '@/types'

const IDEA_STATUS_OPTIONS = [
  { value: 'bruta', label: 'Ideia Bruta' },
  { value: 'em_desenvolvimento', label: 'Em Desenvolvimento' },
  { value: 'transformada', label: 'Transformada' },
  { value: 'arquivada', label: 'Arquivada' },
]

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [view, setView] = useState<'grid' | 'list'>('grid')

  // Read initial filters from URL (e.g., ?status=bruta, ?category=xxx)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const initial: Record<string, string> = {}
    for (const k of ['status', 'category', 'urgency']) {
      const v = params.get(k)
      if (v) initial[k] = v
    }
    if (Object.keys(initial).length) setFilters(initial)
    const q = params.get('q')
    if (q) setSearch(q)
  }, [])
  const [createOpen, setCreateOpen] = useState(false)
  const [transformIdea, setTransformIdea] = useState<Idea | null>(null)
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
    const [ideasRes, catsRes] = await Promise.all([
      supabase.from('ideas').select('*, category:categories(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ])
    if (ideasRes.error) {
      toast({ title: 'Erro ao carregar ideias', description: ideasRes.error.message, variant: 'destructive' })
    } else {
      setIdeas((ideasRes.data ?? []) as Idea[])
    }
    if (catsRes.data) setCategories(catsRes.data)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    let result = ideas
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.category?.name.toLowerCase().includes(q)
      )
    }
    if (filters.category) result = result.filter(i => i.category_id === filters.category)
    if (filters.status) result = result.filter(i => i.status === filters.status)
    if (filters.urgency) result = result.filter(i => i.urgency === filters.urgency)
    return result
  }, [ideas, search, filters])

  const handleArchive = async (idea: Idea) => {
    const { error } = await supabase.from('ideas').update({ status: 'arquivada' }).eq('id', idea.id)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return
    }
    setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, status: 'arquivada' } : i))
    toast({ title: 'Ideia arquivada', variant: 'success' })
  }

  const handleDelete = async (idea: Idea) => {
    if (!confirm('Excluir esta ideia?')) return
    const { error } = await supabase.from('ideas').delete().eq('id', idea.id)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return
    }
    setIdeas(prev => prev.filter(i => i.id !== idea.id))
    toast({ title: 'Ideia excluída', variant: 'success' })
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-gold-400" />
              Caixa de Ideias
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">{ideas.length} ideias salvas</p>
          </div>
          <Button className="gap-2 self-start sm:self-auto" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Nova ideia
          </Button>
        </div>

        <div className="space-y-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por título, descrição ou categoria..." />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <FilterPanel
              categories={categories}
              filters={filters}
              onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
              onClear={() => setFilters({})}
              showUrgency
              statusOptions={IDEA_STATUS_OPTIONS}
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
            <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{ideas.length === 0 ? 'Nenhuma ideia ainda' : 'Nenhuma ideia encontrada'}</p>
            <p className="text-sm mt-1">{ideas.length === 0 ? 'Crie a primeira clicando em "Nova ideia"' : 'Ajuste os filtros'}</p>
          </div>
        ) : (
          <div className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {filtered.map(idea => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onArchive={handleArchive}
                onDelete={handleDelete}
                onTransform={i => setTransformIdea(i)}
              />
            ))}
          </div>
        )}
      </div>

      <IdeaQuickDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories}
        onCreated={(created, autoTransform) => {
          setIdeas(prev => [created, ...prev])
          if (autoTransform) setTransformIdea(created)
        }}
      />

      <TransformIdeaDialog
        idea={transformIdea}
        onClose={() => setTransformIdea(null)}
      />
    </AppLayout>
  )
}
