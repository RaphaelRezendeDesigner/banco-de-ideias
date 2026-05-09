'use client'

import { useState } from 'react'
import { Save, Sparkles, Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { generatePromptForAI } from '@/lib/utils'
import type { ContentTone, TextFormat } from '@/types'

interface BrainstormFormData {
  central_idea: string
  problem_solved: string
  target_audience: string
  emotion: string
  impact_phrase: string
  main_arguments: string
  local_examples: string
  tone: ContentTone
  format: TextFormat
  free_notes: string
}

const INITIAL: BrainstormFormData = {
  central_idea: '',
  problem_solved: '',
  target_audience: '',
  emotion: '',
  impact_phrase: '',
  main_arguments: '',
  local_examples: '',
  tone: 'emocional',
  format: 'video',
  free_notes: '',
}

interface BrainstormFormProps {
  initialData?: Partial<BrainstormFormData>
  onSave?: (data: BrainstormFormData) => Promise<void>
  onGenerateText?: (data: BrainstormFormData) => Promise<void>
  hasAiConfigured?: boolean
}

export function BrainstormForm({ initialData, onSave, onGenerateText, hasAiConfigured }: BrainstormFormProps) {
  const [form, setForm] = useState<BrainstormFormData>({ ...INITIAL, ...initialData })
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()

  const update = (key: keyof BrainstormFormData, value: string) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSave = async () => {
    if (!form.central_idea.trim()) {
      toast({ title: 'Ideia central obrigatória', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      await onSave?.(form)
      toast({ title: 'Brainstorm salvo!', variant: 'success' })
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleCopyPrompt = async () => {
    const prompt = generatePromptForAI(form)
    await navigator.clipboard.writeText(prompt)
    toast({ title: 'Prompt copiado!', description: 'Cole no ChatGPT, Claude ou outra IA.', variant: 'success' })
  }

  const handleGenerateText = async () => {
    if (!onGenerateText) return
    setGenerating(true)
    try {
      await onGenerateText(form)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar'
      toast({ title: 'Erro na geração', description: msg, variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="central_idea">Qual é a ideia central? *</Label>
          <Input
            id="central_idea"
            placeholder="Ex: O Amazonas merece investimentos proporcionais à sua importância para o Brasil"
            value={form.central_idea}
            onChange={e => update('central_idea', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem_solved">Qual problema essa ideia resolve?</Label>
          <Textarea
            id="problem_solved"
            placeholder="Ex: Invisibilidade do Amazonas nas decisões federais de investimento"
            value={form.problem_solved}
            onChange={e => update('problem_solved', e.target.value)}
            className="h-24"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_audience">Qual público quero atingir?</Label>
          <Textarea
            id="target_audience"
            placeholder="Ex: População amazonense, eleitores do interior, lideranças políticas"
            value={form.target_audience}
            onChange={e => update('target_audience', e.target.value)}
            className="h-24"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emotion">Qual emoção quero despertar?</Label>
          <Input
            id="emotion"
            placeholder="Ex: Orgulho regional + indignação justa + esperança"
            value={form.emotion}
            onChange={e => update('emotion', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="impact_phrase">Qual frase de impacto posso usar?</Label>
          <Input
            id="impact_phrase"
            placeholder="Ex: O Amazonas não pede favor — pede justiça"
            value={form.impact_phrase}
            onChange={e => update('impact_phrase', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="main_arguments">Quais argumentos principais?</Label>
          <Textarea
            id="main_arguments"
            placeholder="Ex: Dados de investimento per capita; contribuição ambiental; população vulnerável"
            value={form.main_arguments}
            onChange={e => update('main_arguments', e.target.value)}
            className="h-24"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="local_examples">Quais exemplos locais ou reais posso citar?</Label>
          <Textarea
            id="local_examples"
            placeholder="Ex: Municípios sem hospital; custo do frete; isolamento na cheia"
            value={form.local_examples}
            onChange={e => update('local_examples', e.target.value)}
            className="h-24"
          />
        </div>

        <div className="space-y-2">
          <Label>Qual tom do conteúdo?</Label>
          <Select value={form.tone} onValueChange={v => update('tone', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="firme">Firme</SelectItem>
              <SelectItem value="emocional">Emocional</SelectItem>
              <SelectItem value="institucional">Institucional</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="provocativo">Provocativo</SelectItem>
              <SelectItem value="tecnico">Técnico</SelectItem>
              <SelectItem value="esperancoso">Esperançoso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Qual formato?</Label>
          <Select value={form.format} onValueChange={v => update('format', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">Vídeo curto</SelectItem>
              <SelectItem value="legenda">Legenda de Instagram</SelectItem>
              <SelectItem value="discurso">Discurso</SelectItem>
              <SelectItem value="release">Release</SelectItem>
              <SelectItem value="story">Story</SelectItem>
              <SelectItem value="carrossel">Carrossel</SelectItem>
              <SelectItem value="audio">Roteiro de áudio</SelectItem>
              <SelectItem value="site">Texto para site</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="free_notes">Observações livres</Label>
          <Textarea
            id="free_notes"
            placeholder="Qualquer informação extra, referências, contexto..."
            value={form.free_notes}
            onChange={e => update('free_notes', e.target.value)}
            className="h-24"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        {onSave && (
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar brainstorm
          </Button>
        )}

        <Button variant="outline" onClick={handleCopyPrompt} className="gap-2">
          <Copy className="w-4 h-4" />
          Gerar prompt para IA externa
        </Button>

        {hasAiConfigured && onGenerateText && (
          <Button variant="outline" onClick={handleGenerateText} disabled={generating} className="gap-2 border-gold-500/30 text-gold-400 hover:bg-gold-500/10">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Gerar texto com IA integrada
          </Button>
        )}
      </div>
    </div>
  )
}
