'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Brain, Archive, Trash2, Clock, Tag, FileText } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryBadge } from '@/components/CategoryBadge'
import { IdeaStatusBadge } from '@/components/StatusBadge'
import { MOCK_IDEAS, MOCK_TEXTS, MOCK_BRAINSTORMS } from '@/lib/mock-data'
import { formatDate, URGENCY_LABELS } from '@/lib/utils'

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const idea = MOCK_IDEAS.find(i => i.id === id)

  const relatedTexts = MOCK_TEXTS.filter(t => t.idea_id === id)
  const relatedBrainstorms = MOCK_BRAINSTORMS.filter(b => b.idea_id === id)

  if (!idea) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto text-center py-16">
          <p className="text-muted-foreground">Ideia não encontrada</p>
          <Button variant="ghost" asChild className="mt-4 gap-2">
            <Link href="/ideas"><ArrowLeft className="w-4 h-4" /> Voltar</Link>
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Back */}
        <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
          <Link href="/ideas"><ArrowLeft className="w-4 h-4" /> Caixa de Ideias</Link>
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <IdeaStatusBadge status={idea.status} />
              <Badge variant="outline">{URGENCY_LABELS[idea.urgency]}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-foreground leading-snug">{idea.title}</h1>
            {idea.category && <CategoryBadge category={idea.category} />}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href={`/brainstorm?idea=${idea.id}`}>
                <Brain className="w-4 h-4" />
                Brainstorm
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Archive className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {idea.description && (
          <Card>
            <CardContent className="p-5">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{idea.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Tags & Meta */}
        <div className="flex flex-wrap gap-4 text-sm">
          {idea.tags && idea.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              {idea.tags.map(t => (
                <Badge key={t.id} variant="outline">{t.name}</Badge>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            Criada em {formatDate(idea.created_at)}
          </div>
        </div>

        {/* Brainstorms relacionados */}
        {relatedBrainstorms.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-gold-400" />
                Brainstorms Relacionados ({relatedBrainstorms.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {relatedBrainstorms.map(bs => (
                <div key={bs.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p className="font-medium text-foreground">{bs.central_idea}</p>
                  <p className="text-muted-foreground text-xs mt-1">{formatDate(bs.created_at)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Textos gerados */}
        {relatedTexts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-gold-400" />
                Textos Gerados ({relatedTexts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {relatedTexts.map(text => (
                <Link key={text.id} href={`/texts/${text.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                  <span className="text-sm font-medium group-hover:text-gold-400 transition-colors">{text.title}</span>
                  <Badge variant="outline" className="text-[11px]">{text.format}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button className="gap-2 flex-1" asChild>
            <Link href={`/brainstorm?idea=${idea.id}`}>
              <Brain className="w-4 h-4" />
              Transformar em brainstorm
            </Link>
          </Button>
          <Button variant="destructive" size="icon" title="Excluir ideia">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
