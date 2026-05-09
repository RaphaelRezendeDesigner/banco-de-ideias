'use client'

import Link from 'next/link'
import { MoreHorizontal, Edit, Brain, Archive, Trash2, ArrowUpRight, Flame, Circle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from './CategoryBadge'
import { IdeaStatusBadge } from './StatusBadge'
import type { Idea } from '@/types'
import { formatRelative, truncate } from '@/lib/utils'

interface IdeaCardProps {
  idea: Idea
  onEdit?: (idea: Idea) => void
  onArchive?: (idea: Idea) => void
  onDelete?: (idea: Idea) => void
  onTransform?: (idea: Idea) => void
}

const URGENCY_ICON = {
  baixa: <Circle className="w-3 h-3 text-emerald-400" />,
  media: <Circle className="w-3 h-3 text-amber-400 fill-amber-400" />,
  alta: <Flame className="w-3 h-3 text-red-400" />,
}

export function IdeaCard({ idea, onEdit, onArchive, onDelete, onTransform }: IdeaCardProps) {
  return (
    <Card className="group hover:border-gold-500/30 transition-all duration-200 hover:shadow-md hover:shadow-gold-500/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {URGENCY_ICON[idea.urgency]}
              <span className="capitalize">{idea.urgency}</span>
            </div>
            <IdeaStatusBadge status={idea.status} />
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(idea)} title="Editar">
                <Edit className="w-3.5 h-3.5" />
              </Button>
            )}
            {onTransform && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onTransform(idea)} title="Transformar em texto">
                <Brain className="w-3.5 h-3.5" />
              </Button>
            )}
            {onArchive && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onArchive(idea)} title="Arquivar">
                <Archive className="w-3.5 h-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(idea)} title="Excluir">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        <Link href={`/ideas/${idea.id}`} className="block group/link">
          <h3 className="font-semibold text-foreground group-hover/link:text-gold-400 transition-colors mb-1.5 leading-snug">
            {idea.title}
            <ArrowUpRight className="inline w-3.5 h-3.5 ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </h3>
        </Link>

        {idea.description && (
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            {truncate(idea.description, 140)}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {idea.category && <CategoryBadge category={idea.category} />}
            {idea.tags?.slice(0, 3).map(tag => (
              <Badge key={tag.id} variant="outline" className="text-[11px] px-2 py-0">{tag.name}</Badge>
            ))}
            {(idea.tags?.length ?? 0) > 3 && (
              <span className="text-[11px] text-muted-foreground">+{(idea.tags?.length ?? 0) - 3}</span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">{formatRelative(idea.created_at)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
