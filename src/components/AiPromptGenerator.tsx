'use client'

import { useState } from 'react'
import { Copy, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { generatePromptForAI } from '@/lib/utils'
import type { Brainstorm, GenerationType } from '@/types'

interface AiPromptGeneratorProps {
  brainstorm: Brainstorm
  onGenerate?: (type: GenerationType) => Promise<void>
  hasAiConfigured?: boolean
}

const GENERATION_OPTIONS: { value: GenerationType; label: string }[] = [
  { value: 'roteiro_30s', label: 'Roteiro de Vídeo — 30 segundos' },
  { value: 'roteiro_45s', label: 'Roteiro de Vídeo — 45 segundos' },
  { value: 'roteiro_60s', label: 'Roteiro de Vídeo — 1 minuto' },
  { value: 'legenda_instagram', label: 'Legenda para Instagram' },
  { value: 'texto_institucional', label: 'Texto Institucional' },
  { value: 'release', label: 'Release para Imprensa' },
  { value: 'discurso_curto', label: 'Discurso Curto' },
  { value: 'frases_impacto', label: 'Frases de Impacto' },
  { value: 'ideias_carrossel', label: 'Ideias de Carrossel' },
]

export function AiPromptGenerator({ brainstorm, onGenerate, hasAiConfigured }: AiPromptGeneratorProps) {
  const [selectedType, setSelectedType] = useState<GenerationType>('roteiro_60s')
  const [generating, setGenerating] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const { toast } = useToast()

  const prompt = generatePromptForAI(brainstorm as Parameters<typeof generatePromptForAI>[0])

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(prompt)
    toast({ title: 'Prompt copiado!', description: 'Cole no ChatGPT, Claude ou outra IA.', variant: 'success' })
  }

  const handleGenerate = async () => {
    if (!onGenerate) return
    setGenerating(true)
    try {
      await onGenerate(selectedType)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar texto'
      toast({ title: 'Erro na geração', description: message, variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold-400" />
          Geração com IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de conteúdo</label>
          <Select value={selectedType} onValueChange={v => setSelectedType(v as GenerationType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GENERATION_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={handleCopyPrompt}>
            <Copy className="w-4 h-4" />
            Copiar prompt para IA externa
          </Button>

          {hasAiConfigured && onGenerate && (
            <Button className="flex-1 gap-2" onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Gerar com IA</>
              )}
            </Button>
          )}
        </div>

        {!hasAiConfigured && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            IA integrada não configurada. Configure <code className="text-gold-400">OPENAI_API_KEY</code> ou <code className="text-gold-400">ANTHROPIC_API_KEY</code> no <code>.env</code> para habilitar a geração direta.
          </p>
        )}

        {/* Prompt preview */}
        <div>
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPrompt ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showPrompt ? 'Ocultar' : 'Visualizar'} prompt gerado
          </button>

          {showPrompt && (
            <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-60 overflow-y-auto border border-border">
              {prompt}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
