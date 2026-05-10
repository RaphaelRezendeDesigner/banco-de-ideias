'use client'

import { useEffect, useState, useRef } from 'react'
import { Sparkles, Loader2, Copy, Check, AlertCircle, Wand2 } from 'lucide-react'
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
  const [savingAll, setSavingAll] = useState(false)
  const [results, setResults] = useState<FormatResult[]>([])
  const [savedTypes, setSavedTypes] = useState<Set<GenerationType>>(new Set())
  const [activeTab, setActiveTab] = useState<string>(FORMATS[0].type)
  const { toast } = useToast()
  const lastIdeaIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!idea) {
      lastIdeaIdRef.current = null
      return
    }
    if (lastIdeaIdRef.current === idea.id) return
    lastIdeaIdRef.current = idea.id
    setResults([])
    setSavedTypes(new Set())
    setActiveTab(FORMATS[0].type)
    void generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea?.id])

  const generate = async () => {
    if (!idea) return
    setLoading(true)
    setSavedTypes(new Set())
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
      const formats = json.formats as FormatResult[]
      setResults(formats)
      // Auto-save all successful generations to the library
      void saveAll(formats, true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast({ title: 'Erro ao gerar', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const saveAll = async (formats: FormatResult[], silent = false) => {
    if (!idea) return
    if (!silent) setSavingAll(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      if (!silent) toast({ title: 'Faça login para salvar', variant: 'destructive' })
      setSavingAll(false)
      return
    }
    const toInsert = formats
      .filter(r => !r.error && r.result && !savedTypes.has(r.type))
      .map(r => {
        const meta = FORMATS.find(f => f.type === r.type)!
        return {
          user_id: user.id,
          idea_id: idea.id,
          title: `${idea.title} — ${meta.label}`,
          content: r.result,
          category_id: idea.category_id || null,
          status: 'rascunho',
          format: meta.format,
          word_count: r.result.trim().split(/\s+/).filter(Boolean).length,
        }
      })

    if (toInsert.length === 0) {
      if (!silent) toast({ title: 'Nada para salvar', variant: 'default' })
      setSavingAll(false)
      return
    }

    const { error } = await supabase.from('texts').insert(toInsert)
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } else {
      setSavedTypes(prev => {
        const next = new Set(prev)
        toInsert.forEach(t => next.add(formats.find(f => `${idea.title} — ${FORMATS.find(x => x.type === f.type)!.label}` === t.title)!.type))
        formats.forEach(f => { if (!f.error && f.result) next.add(f.type) })
        return next
      })
      if (!silent) {
        toast({
          title: `${toInsert.length} texto(s) salvos na biblioteca!`,
          variant: 'success',
        })
      } else {
        toast({
          title: `${toInsert.length} formatos salvos automaticamente`,
          description: 'Disponíveis em Biblioteca de Textos',
          variant: 'success',
        })
      }
    }
    setSavingAll(false)
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast({ title: 'Copiado!', variant: 'success' })
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
          {idea && <p className="text-sm text-muted-foreground pt-1">{idea.title}</p>}
        </DialogHeader>

        {loading && results.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
            <p className="text-sm text-muted-foreground">Gerando 5 formatos em paralelo...</p>
            <p className="text-xs text-muted-foreground">Salvaremos todos automaticamente na biblioteca</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum resultado. Tente novamente.</p>
            <Button onClick={generate} variant="outline" className="gap-2">
              <Wand2 className="w-4 h-4" /> Gerar
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="flex-wrap h-auto">
              {FORMATS.map(f => {
                const saved = savedTypes.has(f.type)
                return (
                  <TabsTrigger key={f.type} value={f.type} className="text-xs gap-1">
                    {saved && <Check className="w-3 h-3 text-emerald-400" />}
                    {f.label}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {FORMATS.map(f => {
              const r = results.find(x => x.type === f.type)
              const saved = savedTypes.has(f.type)
              return (
                <TabsContent key={f.type} value={f.type} className="flex-1 overflow-y-auto mt-3">
                  {!r ? (
                    <p className="text-sm text-muted-foreground p-4">Sem resultado</p>
                  ) : r.error ? (
                    <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg">{r.error}</div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          {saved ? (
                            <><Check className="w-3.5 h-3.5 text-emerald-400" /> Salvo na biblioteca</>
                          ) : (
                            <>Não salvo</>
                          )}
                        </div>
                        <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => handleCopy(r.result)}>
                          <Copy className="w-3 h-3" /> Copiar
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

        <div className="flex justify-between items-center gap-2 pt-3 border-t border-border">
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          <div className="flex items-center gap-2">
            {!loading && results.length > 0 && (
              <Button variant="outline" onClick={generate} className="gap-2">
                <Wand2 className="w-4 h-4" /> Gerar de novo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
