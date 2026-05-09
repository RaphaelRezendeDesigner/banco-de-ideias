'use client'

import Link from 'next/link'
import { FileText, Clock, Hash, ArrowUpRight, Copy, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from './CategoryBadge'
import { TextStatusBadge } from './StatusBadge'
import type { Text } from '@/types'
import { formatRelative, truncate, estimateSpeechTime, FORMAT_LABELS } from '@/lib/utils'

interface TextCardProps {
  text: Text
  onCopy?: (text: Text) => void
  onDelete?: (text: Text) => void
}

export function TextCard({ text, onCopy, onDelete }: TextCardProps) {
  const speechTime = estimateSpeechTime(text.word_count)

  return (
    <Card className="group hover:border-gold-500/30 transition-all duration-200 hover:shadow-md hover:shadow-gold-500/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <TextStatusBadge status={text.status} />
            <Badge variant="outline" className="text-[11px]">
              {FORMAT_LABELS[text.format] || text.format}
            </Badge>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onCopy && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onCopy(text)} title="Copiar texto">
                <Copy className="w-3.5 h-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(text)} title="Excluir">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        <Link href={`/texts/${text.id}`} className="block group/link">
          <h3 className="font-semibold text-foreground group-hover/link:text-gold-400 transition-colors mb-1.5 leading-snug">
            {text.title}
            <ArrowUpRight className="inline w-3.5 h-3.5 ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </h3>
        </Link>

        {text.content && (
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            {truncate(text.content.replace(/\n/g, ' '), 130)}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {text.category && <CategoryBadge category={text.category} />}
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Hash className="w-3 h-3" />
              {text.word_count} palavras
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {speechTime}
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">{formatRelative(text.created_at)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
