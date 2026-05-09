'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Video, Mic, Globe, Archive,
  Calendar, Link2, Hash, Clock, CheckCircle,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { TextEditor } from '@/components/TextEditor'
import { CategoryBadge } from '@/components/CategoryBadge'
import { TextStatusBadge } from '@/components/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { MOCK_TEXTS } from '@/lib/mock-data'
import { FORMAT_LABELS, countWords, estimateSpeechTime, formatDate } from '@/lib/utils'
import type { TextStatus } from '@/types'
import { Separator } from '@/components/ui/separator'

export default function TextDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const original = MOCK_TEXTS.find(t => t.id === id)

  const [content, setContent] = useState(original?.content || '')
  const [notes, setNotes] = useState(original?.notes || '')
  const [publishedLink, setPublishedLink] = useState(original?.published_link || '')
  const [status, setStatus] = useState<TextStatus>(original?.status || 'rascunho')

  if (!original) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto text-center py-16">
          <p className="text-muted-foreground">Texto não encontrado</p>
          <Button variant="ghost" asChild className="mt-4 gap-2">
            <Link href="/texts"><ArrowLeft className="w-4 h-4" /> Voltar</Link>
          </Button>
        </div>
      </AppLayout>
    )
  }

  const wordCount = countWords(content)
  const speechTime = estimateSpeechTime(wordCount)

  const changeStatus = (newStatus: TextStatus) => {
    setStatus(newStatus)
    toast({ title: `Status: ${newStatus}`, variant: 'success' })
  }

  const handleSave = async (val: string) => {
    setContent(val)
    await new Promise(r => setTimeout(r, 500))
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Back */}
        <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
          <Link href="/texts"><ArrowLeft className="w-4 h-4" /> Biblioteca de Textos</Link>
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <TextStatusBadge status={status} />
              <Badge variant="outline">{FORMAT_LABELS[original.format] || original.format}</Badge>
              {original.category && <CategoryBadge category={original.category} />}
            </div>
            <h1 className="text-2xl font-bold leading-snug">{original.title}</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{wordCount} palavras</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />~{speechTime}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(original.created_at)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Status actions */}
        <div className="flex flex-wrap gap-2">
          {status !== 'pronto' && (
            <Button size="sm" variant="outline" className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={() => changeStatus('pronto')}>
              <CheckCircle className="w-4 h-4" />
              Marcar como pronto para gravar
            </Button>
          )}
          {status !== 'gravado' && (
            <Button size="sm" variant="outline" className="gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10" onClick={() => changeStatus('gravado')}>
              <Video className="w-4 h-4" />
              Marcar como gravado
            </Button>
          )}
          {status !== 'publicado' && (
            <Button size="sm" variant="outline" className="gap-2 border-purple-500/30 text-purple-400 hover:bg-purple-500/10" onClick={() => changeStatus('publicado')}>
              <Globe className="w-4 h-4" />
              Marcar como publicado
            </Button>
          )}
          {status !== 'arquivado' && (
            <Button size="sm" variant="ghost" className="gap-2" onClick={() => changeStatus('arquivado')}>
              <Archive className="w-4 h-4" />
              Arquivar
            </Button>
          )}
        </div>

        {/* Editor */}
        <TextEditor
          value={content}
          onChange={setContent}
          onSave={handleSave}
          className="min-h-[380px]"
          autoSave
        />

        {/* Side info */}
        <div className="grid sm:grid-cols-2 gap-4">
          {status === 'publicado' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5" />
                Link da publicação
              </Label>
              <Input
                value={publishedLink}
                onChange={e => setPublishedLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mic className="w-3.5 h-3.5" />
              Observações
            </Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas de gravação, contexto..."
              className="h-24"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
