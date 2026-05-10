'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Archive, Trash2, Clock, Tag, FileText, Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryBadge } from '@/components/CategoryBadge'
import { IdeaStatusBadge } from '@/components/StatusBadge'
import { TransformIdeaDialog } from '@/components/TransformIdeaDialog'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { formatDate, URGENCY_LABELS } from '@/lib/utils'
import type { Idea, Text } from '@/types'

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [idea, setIdea] = useState<Idea | null>(null)
  const [relatedTexts, setRelatedTexts] = useState<Text[]>([])
  const [loading, setLoading] = useState(true)
  const [transformOpen, setTransformOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [ideaRes, textsRes] = await Promise.all([
      supabase.from('ideas').select('*, category:categories(*)').eq('id', id).single(),
      supabase.from('texts').select('*').eq('idea_id', id).order('created_at', { ascending: false }),
    ])
    if (ideaRes.error || !ideaRes.data) {
      setIdea(null)
    } else {
      setIdea(ideaRes.data as Idea)
    }
    setRelatedTexts((textsRes.data ?? []) as Text[])
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => { load() }, [load])

  const handleArchive = async () => {
    if (!idea) return
    const { error } = await supabase.from('ideas').update({ status: 'arquivada' }).eq('id', id)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Ideia arquivada', variant: 'success' })
    router.push('/ideas')
  }

  const handleDelete = async () => {
    if (!confirm('Excluir esta ideia? Os textos relacionados ficarão sem ideia mas continuarão na biblioteca.')) return
    const { error } = await supabase.from('ideas').delete().eq('id', id)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Ideia excluída', variant: 'success' })
    router.push('/ideas')
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

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
        <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
          <Link href="/ideas"><ArrowLeft className="w-4 h-4" /> Caixa de Ideias</Link>
        </Button>

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
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setTransformOpen(true)}>
              <Sparkles className="w-4 h-4" />
              Gerar com IA
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleArchive} title="Arquivar">
              <Archive className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {idea.description && (
          <Card>
            <CardContent className="p-5">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{idea.description}</p>
            </CardContent>
          </Card>
        )}

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

        <div className="flex gap-3 pt-2">
          <Button className="gap-2 flex-1" onClick={() => setTransformOpen(true)}>
            <Sparkles className="w-4 h-4" />
            Gerar 5 formatos com IA
          </Button>
          <Button variant="destructive" size="icon" title="Excluir ideia" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <TransformIdeaDialog
        idea={transformOpen ? idea : null}
        onClose={() => { setTransformOpen(false); void load() }}
      />
    </AppLayout>
  )
}
