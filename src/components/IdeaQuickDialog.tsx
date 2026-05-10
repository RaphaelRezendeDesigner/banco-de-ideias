'use client'

import { useState } from 'react'
import { Lightbulb, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import type { Idea, Category, UrgencyLevel } from '@/types'

interface IdeaQuickDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  onCreated?: (idea: Idea, autoTransform?: boolean) => void
}

const AI_ENABLED = !!(process.env.NEXT_PUBLIC_AI_PROVIDER && process.env.NEXT_PUBLIC_AI_PROVIDER !== 'none')

export function IdeaQuickDialog({ open, onOpenChange, categories, onCreated }: IdeaQuickDialogProps) {
  const [saving, setSaving] = useState(false)
  const [autoTransform, setAutoTransform] = useState(AI_ENABLED)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    urgency: 'media' as UrgencyLevel,
  })
  const { toast } = useToast()

  const reset = () => setForm({ title: '', description: '', category_id: '', urgency: 'media' })

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Título obrigatório', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({ title: 'Faça login para salvar', variant: 'destructive' })
        return
      }
      const { data, error } = await supabase
        .from('ideas')
        .insert({
          user_id: user.id,
          title: form.title.trim(),
          description: form.description.trim(),
          category_id: form.category_id || null,
          urgency: form.urgency,
          status: 'bruta',
        })
        .select('*, category:categories(*)')
        .single()
      if (error) throw error
      const created = data as Idea
      onCreated?.(created, autoTransform)
      toast({
        title: 'Ideia salva!',
        description: autoTransform ? 'Gerando formatos com IA...' : undefined,
        variant: 'success',
      })
      reset()
      onOpenChange(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast({ title: 'Erro ao salvar', description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gold-500/20">
              <Lightbulb className="w-4 h-4 text-gold-400" />
            </div>
            Nova Ideia
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qd-title">Título *</Label>
            <Input
              id="qd-title"
              placeholder="Qual é a ideia?"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qd-desc">Descrição</Label>
            <Textarea
              id="qd-desc"
              placeholder="Expanda a ideia..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.category_id || '__none__'}
                onValueChange={v => setForm(f => ({ ...f, category_id: v === '__none__' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem categoria</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Urgência</Label>
              <Select
                value={form.urgency}
                onValueChange={v => setForm(f => ({ ...f, urgency: v as UrgencyLevel }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">🟢 Baixa</SelectItem>
                  <SelectItem value="media">🟡 Média</SelectItem>
                  <SelectItem value="alta">🔴 Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {AI_ENABLED && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-gold-500/20 bg-gold-500/5 p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Gerar formatos com IA</p>
                  <p className="text-xs text-muted-foreground">Vídeo, story, carrossel, legenda — tudo de uma vez</p>
                </div>
              </div>
              <Switch checked={autoTransform} onCheckedChange={setAutoTransform} />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : autoTransform && AI_ENABLED ? (
                <><Sparkles className="w-4 h-4" /> Salvar e gerar</>
              ) : (
                <><Lightbulb className="w-4 h-4" /> Salvar</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
