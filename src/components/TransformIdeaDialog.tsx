'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Loader2, Copy, Save, AlertCircle, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import type { Idea, GenerationType, TextFormat } from '@/types'

interface TransformIdeaDialogProps {
  idea: Idea | null
  onClose: () => void
}

const FORMATS: { type: GenerationType; label: string; format: TextFormat }[] = [
  { type: 'roteiro_30s', label: 'Vídeo 30s', format: 'video' },
  { type: 'roteiro_60s', label: 'Vídeo 60s', format: 'video' },
  { type: 'legenda_instagram', label: 'Legenda Instagram', format: 'legenda' },
  { type: 'ideias_carrossel', label: 'Carrossel', format: 'carrossel' },
  { type: 'frases_impacto', label: 'Frases de Impacto', format: 'story' },
]

interface FormatResult {
  type: GenerationType
  result: string
  error: string | null
}

export function TransformIdeaDialog({ idea, onClose }: TransformIdeaDialogProps) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<FormatResult[]>([])
  const [activeTab, setActiveTab] = useState<string>(FORMATS[0].type)
  const { toast } = useToast()

  useEffect(() => {
    if (!idea) return
    setResults([])
    setActiveTab(FORMATS[0].type)
    void generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea?.id])

  const generate = async () => {
    if (!idea) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: { title: idea.title, description: idea.description },
          types: FORMATS.map(f => f.type),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro na geração')
      setResults(json.formats as FormatResult[])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast({ title: 'Erro ao gerar', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast({ title: 'Copiado!', variant: 'success' })
  }

  const handleSave = async (formatType: GenerationType, content: string) => {
    if (!idea) return
    const formatMeta = FORMATS.find(f => f.type === formatType)!
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: 'Faça login para salvar', variant: 'destructive' })
      return
    }
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length
    const { error } = await supabase.from('texts').insert({
      user_id: user.id,
      idea_id: idea.id,
      title: `${idea.title} — ${formatMeta.label}`,
      content,
      category_id: idea.category_id || null,
      status: 'rascunho',
      format: formatMeta.format,
      word_count: wordCount,
    })
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Texto salvo na biblioteca!', variant: 'success' })
  }

  return (
    <Dialog open={!!idea} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gold-500/20">
              <Sparkles className="w-4 h-4 text-gold-400" />
            </div>
            Transformar com IA
          </DialogTitle>
          {idea && (
            <p className="text-sm text-muted-foreground pt-1">{idea.title}</p>
          )}
        </DialogHeader>

        {loading && results.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
            <p className="text-sm text-muted-foreground">Gerando 5 formatos em paralelo...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum resultado. Tente novamente.</p>
            <Button onClick={generate} variant="outline" className="gap-2">
              <Wand2 className="w-4 h-4" />
              Gerar
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="flex-wrap h-auto">
              {FORMATS.map(f => (
                <TabsTrigger key={f.type} value={f.type} className="text-xs">
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {FORMATS.map(f => {
              const r = results.find(x => x.type === f.type)
              return (
                <TabsContent key={f.type} value={f.type} className="flex-1 overflow-y-auto mt-3">
                  {!r ? (
                    <p className="text-sm text-muted-foreground p-4">Sem resultado</p>
                  ) : r.error ? (
                    <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg">
                      {r.error}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => handleCopy(r.result)}>
                          <Copy className="w-3 h-3" /> Copiar
                        </Button>
                        <Button size="sm" className="gap-1.5 h-8" onClick={() => handleSave(f.type, r.result)}>
                          <Save className="w-3 h-3" /> Salvar na biblioteca
                        </Button>
                      </div>
                      <pre className="whitespace-pre-wrap text-sm font-sans bg-muted/30 border border-border rounded-lg p-4 leading-relaxed">
                        {r.result}
                      </pre>
                    </div>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-border">
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          {!loading && results.length > 0 && (
            <Button variant="outline" onClick={generate} className="gap-2">
              <Wand2 className="w-4 h-4" /> Gerar de novo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
