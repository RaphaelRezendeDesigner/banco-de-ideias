'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { Category } from '@/types'

interface FilterPanelProps {
  categories: Category[]
  filters: {
    category?: string
    status?: string
    format?: string
    urgency?: string
  }
  onFilterChange: (key: string, value: string) => void
  onClear: () => void
  showFormat?: boolean
  showUrgency?: boolean
  statusOptions?: { value: string; label: string }[]
}

export function FilterPanel({
  categories, filters, onFilterChange, onClear,
  showFormat, showUrgency,
  statusOptions = [],
}: FilterPanelProps) {
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Select value={filters.category || '__all__'} onValueChange={v => onFilterChange('category', v === '__all__' ? '' : v)}>
        <SelectTrigger className="w-40 h-8 text-xs">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todas</SelectItem>
          {categories.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {statusOptions.length > 0 && (
        <Select value={filters.status || '__all__'} onValueChange={v => onFilterChange('status', v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {statusOptions.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showUrgency && (
        <Select value={filters.urgency || '__all__'} onValueChange={v => onFilterChange('urgency', v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="Urgência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas</SelectItem>
            <SelectItem value="baixa">🟢 Baixa</SelectItem>
            <SelectItem value="media">🟡 Média</SelectItem>
            <SelectItem value="alta">🔴 Alta</SelectItem>
          </SelectContent>
        </Select>
      )}

      {showFormat && (
        <Select value={filters.format || '__all__'} onValueChange={v => onFilterChange('format', v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Formato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            <SelectItem value="video">Vídeo</SelectItem>
            <SelectItem value="legenda">Legenda Instagram</SelectItem>
            <SelectItem value="discurso">Discurso</SelectItem>
            <SelectItem value="release">Release</SelectItem>
            <SelectItem value="story">Story</SelectItem>
            <SelectItem value="carrossel">Carrossel</SelectItem>
            <SelectItem value="audio">Áudio</SelectItem>
            <SelectItem value="site">Site</SelectItem>
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-8 text-xs gap-1">
          <X className="w-3 h-3" />
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
