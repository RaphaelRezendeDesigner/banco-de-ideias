'use client'

import { useState } from 'react'
import { Brain, Sparkles, FileText, Loader2, Copy, Save } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { BrainstormForm } from '@/components/BrainstormForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import type { GenerationType, TextFormat } from '@/types'

interface BrainstormData {
  central_idea: string
  problem_solved: string
  target_audience: string
  emotion: string
  impact_phrase: string
  main_arguments: string
  local_examples: string
  tone: string
  format: string
  free_notes: string
}

const FORMATS: { type: GenerationType; label: string; format: TextFormat }[] = [
  { type: 'roteiro_30s', label: 'Vídeo 30s', format: 'video' },
  { type: 'roteiro_60s', label: 'Vídeo 60s', format: 'video' },
  { type: 'legenda_instagram', label: 'Legenda IG', format: 'legenda' },
  { type: 'ideias_carrossel', label: 'Carrossel', format: 'carrossel' },
  { type: 'frases_impacto', label: 'Frases', format: 'story' },
]

interface FormatResult {
  type: GenerationType
  result: string
  error: string | null
}

const AI_ENABLED = !!(process.env.NEXT_PUBLIC_AI_PROVIDER && process.env.NEXT_PUBLIC_AI_PROVIDER !== 'none')

export default function BrainstormPage() {
  const [tab, setTab] = useState('form')
  const [results, setResults] = useState<FormatResult[]>([])
  const [activeResult, setActiveResult] = useState<string>(FORMATS[0].type)
  const [generating, setGenerating] = useState(false)
  const [savedBrainstormId, setSavedBrainstormId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSave = async (data: BrainstormData) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: 'Faça login para salvar', variant: 'destructive' })
      return
    }
    const { data: saved, error } = await supabase
      .from('brainstorms')
      .insert({ user_id: user.id, ...data })
      .select()
      .single()
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
      return
    }
    setSavedBrainstormId(saved.id)
  }

  const handleGenerateText = async (data: BrainstormData) => {
    setGenerating(true)
    setResults([])
    try {
      const res = await fetch('/api/ai/generate-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brainstorm: data, types: FORMATS.map(f => f.type) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro')
      setResults(json.formats as FormatResult[])
      setTab('result')
      toast({ title: '5 formatos gerados!', variant: 'success' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast({ title: 'Erro na geração', description: message, variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast({ title: 'Copiado!', variant: 'success' })
  }

  const handleSaveText = async (formatType: GenerationType, content: string) => {
    const formatMeta = FORMATS.find(f => f.type === formatType)!
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length
    const { error } = await supabase.from('texts').insert({
      user_id: user.id,
      brainstorm_id: savedBrainstormId,
      title: `Brainstorm — ${formatMeta.label}`,
      content,
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
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-gold-400" />
              Brainstorm Guiado
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Estruture sua ideia e gere 5 formatos com IA
            </p>
          </div>
          {!AI_ENABLED && (
            <Badge variant="outline" className="hidden sm:flex text-xs gap-1">
              <Sparkles className="w-3 h-3" />
              IA não configurada
            </Badge>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="form" className="gap-2">
              <Brain className="w-3.5 h-3.5" /> Formulário
            </TabsTrigger>
            <TabsTrigger value="result" className="gap-2" disabled={results.length === 0}>
              <FileText className="w-3.5 h-3.5" /> Resultado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="mt-6">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-base text-muted-foreground font-normal">
                  Preencha os campos e clique em "Gerar com IA"
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {generating && (
                  <div className="mb-4 rounded-lg border border-gold-500/30 bg-gold-500/10 p-3 flex items-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                    Gerando 5 formatos em paralelo (10-30s)...
                  </div>
                )}
                <BrainstormForm
                  onSave={handleSave}
                  onGenerateText={handleGenerateText}
                  hasAiConfigured={AI_ENABLED}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="result" className="mt-6">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhum resultado ainda.</p>
            ) : (
              <Tabs value={activeResult} onValueChange={setActiveResult}>
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
                    <TabsContent key={f.type} value={f.type} className="mt-3">
                      {!r ? (
                        <p className="text-sm text-muted-foreground p-4">Sem resultado</p>
                      ) : r.error ? (
                        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg">{r.error}</div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => handleCopy(r.result)}>
                              <Copy className="w-3 h-3" /> Copiar
                            </Button>
                            <Button size="sm" className="gap-1.5 h-8" onClick={() => handleSaveText(f.type, r.result)}>
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
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
