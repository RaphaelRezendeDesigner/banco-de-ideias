'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Plus, Check, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { getPreferredProvider } from '@/lib/ai-preference'
import { loadVoiceContext } from '@/lib/loadVoiceContext'
import type { Idea, Category, UrgencyLevel } from '@/types'

interface SuggestedIdea {
  title: string
  description: string
  urgency: UrgencyLevel
  suggested_category?: string
}

interface SuggestIdeasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  recentIdeas: Idea[]
  onSaved?: (saved: Idea[]) => void
}

const COUNT_OPTIONS = [3, 5, 7, 10]

export function SuggestIdeasDialog({ open, onOpenChange, categories, recentIdeas, onSaved }: SuggestIdeasDialogProps) {
  const [count, setCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [savingAll, setSavingAll] = useState(false)
  const [results, setResults] = useState<SuggestedIdea[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [savedIdx, setSavedIdx] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  const generate = async () => {
    setLoading(true)
    setResults([])
    setSelected(new Set())
    setSavedIdx(new Set())
    try {
      const voiceContext = await loadVoiceContext()
      const res = await fetch('/api/ai/suggest-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count,
          voiceContext,
          provider: getPreferredProvider() ?? undefined,
          recentIdeas: recentIdeas.slice(0, 20).map(i => ({ title: i.title })),
          categories: categories.map(c => ({ name: c.name })),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro')
      const ideas = (json.ideas ?? []) as SuggestedIdea[]
      setResults(ideas)
      // Default: select all
      setSelected(new Set(ideas.map((_, i) => i)))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast({ title: 'Erro ao sugerir', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const toggle = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const saveSelected = async () => {
    setSavingAll(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({ title: 'Faça login', variant: 'destructive' })
        return
      }
      const toInsert = Array.from(selected)
        .filter(i => !savedIdx.has(i))
        .map(i => {
          const s = results[i]
          const cat = s.suggested_category
            ? categories.find(c => c.name.toLowerCase() === s.suggested_category!.toLowerCase())
            : undefined
          return {
            user_id: user.id,
            title: s.title,
            description: s.description,
            urgency: s.urgency,
            status: 'bruta',
            category_id: cat?.id ?? null,
            _idx: i,
          }
        })
      if (toInsert.length === 0) {
        toast({ title: 'Nada para salvar', variant: 'default' })
        return
      }
      const payload = toInsert.map(({ _idx: _unused, ...rest }) => {
        void _unused
        return rest
      })
      const { data, error } = await supabase
        .from('ideas')
        .insert(payload)
        .select('*, category:categories(*)')
      if (error) {
        toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
        return
      }
      const saved = (data ?? []) as Idea[]
      onSaved?.(saved)
      setSavedIdx(prev => {
        const next = new Set(prev)
        toInsert.forEach(t => next.add(t._idx))
        return next
      })
      toast({ title: `${saved.length} ideias salvas!`, variant: 'success' })
    } finally {
      setSavingAll(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gold-500/20">
              <Sparkles className="w-4 h-4 text-gold-400" />
            </div>
            Sugerir ideias com IA
          </DialogTitle>
          <p className="text-sm text-muted-foreground pt-1">
            A IA usa a Voz do Candidato + suas categorias + ideias recentes pra propor temas novos.
          </p>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap rounded-lg border border-border bg-muted/30 p-2.5 text-xs">
          <span className="text-muted-foreground">Quantas ideias:</span>
          {COUNT_OPTIONS.map(n => (
            <Button
              key={n}
              size="sm"
              variant={count === n ? 'default' : 'outline'}
              className="h-7 px-3 text-xs"
              onClick={() => setCount(n)}
              disabled={loading}
            >
              {n}
            </Button>
          ))}
          <Button
            size="sm"
            className="ml-auto h-7 gap-1.5 text-xs"
            onClick={generate}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {results.length > 0 ? 'Gerar de novo' : 'Gerar sugestões'}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 -mx-1 px-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
              <p className="text-sm text-muted-foreground">Buscando ideias originais...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Nenhuma sugestão ainda</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  Preencha a Voz do Candidato (slogans, pautas, palavras-chave) e clique em "Gerar sugestões" pra começar.
                </p>
              </div>
            </div>
          ) : (
            results.map((idea, idx) => {
              const isSelected = selected.has(idx)
              const isSaved = savedIdx.has(idx)
              return (
                <div
                  key={idx}
                  className={`rounded-lg border p-4 transition-colors cursor-pointer ${
                    isSaved ? 'border-emerald-500/40 bg-emerald-500/5' :
                    isSelected ? 'border-gold-500/40 bg-gold-500/5' :
                    'border-border bg-card hover:border-gold-500/20'
                  }`}
                  onClick={() => !isSaved && toggle(idx)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                      isSaved ? 'bg-emerald-500 border-emerald-500' :
                      isSelected ? 'bg-gold-500 border-gold-500' :
                      'border-muted-foreground/40'
                    }`}>
                      {(isSelected || isSaved) && <Check className="w-3 h-3 text-zinc-900" />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground leading-snug">{idea.title}</h3>
                        <span className={`text-[10px] uppercase font-medium px-1.5 py-0.5 rounded ${
                          idea.urgency === 'alta' ? 'bg-red-500/20 text-red-400' :
                          idea.urgency === 'media' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {idea.urgency}
                        </span>
                        {idea.suggested_category && (
                          <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {idea.suggested_category}
                          </span>
                        )}
                        {isSaved && (
                          <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                            salva
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {idea.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="flex justify-between items-center gap-2 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground">
            {results.length > 0 && (
              <>{selected.size} selecionada{selected.size === 1 ? '' : 's'} de {results.length}</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
            {results.length > 0 && (
              <Button
                onClick={saveSelected}
                disabled={savingAll || selected.size === 0 || Array.from(selected).every(i => savedIdx.has(i))}
                className="gap-2"
              >
                {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Salvar selecionadas
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
