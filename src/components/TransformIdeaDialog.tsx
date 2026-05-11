'use client'

import { useEffect, useState, useRef } from 'react'
import { Sparkles, Loader2, Copy, Check, AlertCircle, Wand2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { getPreferredProvider } from '@/lib/ai-preference'
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
  { type: 'frases_impacto', label: 'Stories', format: 'story' },
]

const SLIDE_OPTIONS = [3, 5, 7, 9]
const STORY_OPTIONS = [3, 5, 7, 10]
const DEFAULT_SLIDES = 5
const DEFAULT_STORIES = 5

interface FormatResult {
  type: GenerationType
  result: string
  error: string | null
}

export function TransformIdeaDialog({ idea, onClose }: TransformIdeaDialogProps) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<FormatResult[]>([])
  const [savedIds, setSavedIds] = useState<Map<GenerationType, string>>(new Map())
  const [regenerating, setRegenerating] = useState<Set<GenerationType>>(new Set())
  const [slideCount, setSlideCount] = useState(DEFAULT_SLIDES)
  const [storyCount, setStoryCount] = useState(DEFAULT_STORIES)
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
    setSavedIds(new Map())
    setSlideCount(DEFAULT_SLIDES)
    setStoryCount(DEFAULT_STORIES)
    setActiveTab(FORMATS[0].type)
    void generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea?.id])

  const generate = async () => {
    if (!idea) return
    setLoading(true)
    setSavedIds(new Map())
    try {
      const res = await fetch('/api/ai/generate-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: { title: idea.title, description: idea.description },
          types: FORMATS.map(f => f.type),
          provider: getPreferredProvider() ?? undefined,
          slideCount,
          storyCount,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro na geração')
      const formats = json.formats as FormatResult[]
      setResults(formats)
      void saveAll(formats)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast({ title: 'Erro ao gerar', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const saveAll = async (formats: FormatResult[]) => {
    if (!idea) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const toInsert = formats
      .filter(r => !r.error && r.result)
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
          // tag the row with which format it represents (re-derivable, but handy)
        }
      })
    if (toInsert.length === 0) return

    const { data, error } = await supabase.from('texts').insert(toInsert).select('id, format, title')
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
      return
    }
    // Map back: title contains the format label, so we recover the type.
    const next = new Map<GenerationType, string>()
    for (const row of data ?? []) {
      const meta = FORMATS.find(f => row.title.endsWith(`— ${f.label}`))
      if (meta) next.set(meta.type, row.id)
    }
    setSavedIds(next)
    toast({
      title: `${toInsert.length} formatos gerados e salvos`,
      description: 'Disponíveis em Biblioteca de Textos',
      variant: 'success',
    })
  }

  const regenerateOne = async (type: GenerationType) => {
    if (!idea) return
    const meta = FORMATS.find(f => f.type === type)!
    setRegenerating(prev => new Set(prev).add(type))
    try {
      const body: Record<string, unknown> = {
        type,
        brainstorm: {
          central_idea: idea.title,
          problem_solved: '',
          target_audience: '',
          emotion: '',
          impact_phrase: '',
          main_arguments: idea.description ?? '',
          local_examples: '',
          tone: 'emocional',
          format: 'video',
          free_notes: '',
        },
        provider: getPreferredProvider() ?? undefined,
      }
      if (type === 'ideias_carrossel') body.slideCount = slideCount
      if (type === 'frases_impacto') body.storyCount = storyCount

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro')
      const newContent = json.result as string

      // Update local state
      setResults(prev => prev.map(r => r.type === type ? { ...r, result: newContent, error: null } : r))

      // Update saved row in DB if we have its id
      const savedId = savedIds.get(type)
      const supabase = createClient()
      if (savedId) {
        await supabase
          .from('texts')
          .update({
            content: newContent,
            word_count: newContent.trim().split(/\s+/).filter(Boolean).length,
          })
          .eq('id', savedId)
      } else {
        // Wasn't saved (probably failed earlier). Insert now.
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('texts').insert({
            user_id: user.id,
            idea_id: idea.id,
            title: `${idea.title} — ${meta.label}`,
            content: newContent,
            category_id: idea.category_id || null,
            status: 'rascunho',
            format: meta.format,
            word_count: newContent.trim().split(/\s+/).filter(Boolean).length,
          }).select('id').single()
          if (data) setSavedIds(prev => new Map(prev).set(type, data.id))
        }
      }
      toast({ title: `${meta.label} atualizado`, variant: 'success' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro'
      toast({ title: 'Erro ao regenerar', description: message, variant: 'destructive' })
    } finally {
      setRegenerating(prev => {
        const next = new Set(prev)
        next.delete(type)
        return next
      })
    }
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
                const saved = savedIds.has(f.type)
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
              const saved = savedIds.has(f.type)
              const isRegen = regenerating.has(f.type)
              return (
                <TabsContent key={f.type} value={f.type} className="flex-1 overflow-y-auto mt-3">
                  {!r ? (
                    <p className="text-sm text-muted-foreground p-4">Sem resultado</p>
                  ) : r.error ? (
                    <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg">{r.error}</div>
                  ) : (
                    <div className="space-y-3">
                      {/* Per-format options bar */}
                      {f.type === 'ideias_carrossel' && (
                        <div className="flex items-center gap-2 flex-wrap rounded-lg border border-border bg-muted/30 p-2.5 text-xs">
                          <span className="text-muted-foreground">Slides:</span>
                          {SLIDE_OPTIONS.map(n => (
                            <Button
                              key={n}
                              size="sm"
                              variant={slideCount === n ? 'default' : 'outline'}
                              className="h-7 px-3 text-xs"
                              onClick={() => setSlideCount(n)}
                              disabled={isRegen}
                            >
                              {n}
                            </Button>
                          ))}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1.5 text-xs ml-auto"
                            onClick={() => regenerateOne('ideias_carrossel')}
                            disabled={isRegen}
                          >
                            {isRegen ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Gerar com {slideCount} slides
                          </Button>
                        </div>
                      )}
                      {f.type === 'frases_impacto' && (
                        <div className="flex items-center gap-2 flex-wrap rounded-lg border border-border bg-muted/30 p-2.5 text-xs">
                          <span className="text-muted-foreground">Stories:</span>
                          {STORY_OPTIONS.map(n => (
                            <Button
                              key={n}
                              size="sm"
                              variant={storyCount === n ? 'default' : 'outline'}
                              className="h-7 px-3 text-xs"
                              onClick={() => setStoryCount(n)}
                              disabled={isRegen}
                            >
                              {n}
                            </Button>
                          ))}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1.5 text-xs ml-auto"
                            onClick={() => regenerateOne('frases_impacto')}
                            disabled={isRegen}
                          >
                            {isRegen ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Gerar {storyCount} stories
                          </Button>
                        </div>
                      )}

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
                <Wand2 className="w-4 h-4" /> Gerar tudo de novo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
