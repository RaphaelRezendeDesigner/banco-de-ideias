'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Lightbulb, LayoutGrid, List } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { IdeaCard } from '@/components/IdeaCard'
import { SearchBar } from '@/components/SearchBar'
import { FilterPanel } from '@/components/FilterPanel'
import { useToast } from '@/components/ui/use-toast'
import type { Idea } from '@/types'
import { MOCK_IDEAS, MOCK_CATEGORIES } from '@/lib/mock-data'

const IDEA_STATUS_OPTIONS = [
  { value: 'bruta', label: 'Ideia Bruta' },
  { value: 'em_desenvolvimento', label: 'Em Desenvolvimento' },
  { value: 'transformada', label: 'Transformada' },
  { value: 'arquivada', label: 'Arquivada' },
]

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>(MOCK_IDEAS)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const { toast } = useToast()

  const filtered = useMemo(() => {
    let result = ideas

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.category?.name.toLowerCase().includes(q) ||
        i.tags?.some(t => t.name.toLowerCase().includes(q))
      )
    }

    if (filters.category) result = result.filter(i => i.category_id === filters.category)
    if (filters.status) result = result.filter(i => i.status === filters.status)
    if (filters.urgency) result = result.filter(i => i.urgency === filters.urgency)

    return result
  }, [ideas, search, filters])

  const handleArchive = (idea: Idea) => {
    setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, status: 'arquivada' } : i))
    toast({ title: 'Ideia arquivada', variant: 'success' })
  }

  const handleDelete = (idea: Idea) => {
    setIdeas(prev => prev.filter(i => i.id !== idea.id))
    toast({ title: 'Ideia excluída', variant: 'success' })
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-gold-400" />
              Caixa de Ideias
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">{ideas.length} ideias salvas</p>
          </div>
          <Button className="gap-2 self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            Nova ideia
          </Button>
        </div>

        {/* Search + Filters */}
        <div className="space-y-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por título, texto, categoria ou tag..."
          />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <FilterPanel
              categories={MOCK_CATEGORIES}
              filters={filters}
              onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
              onClear={() => setFilters({})}
              showUrgency
              statusOptions={IDEA_STATUS_OPTIONS}
            />
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView('grid')}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView('list')}
              >
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma ideia encontrada</p>
            <p className="text-sm mt-1">Tente ajustar os filtros ou crie uma nova ideia</p>
          </div>
        ) : (
          <div className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {filtered.map(idea => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
