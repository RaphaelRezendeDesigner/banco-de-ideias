'use client'

import { useState } from 'react'
import { Lightbulb, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { MOCK_CATEGORIES } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function FloatingIdeaButton() {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    urgency: 'media' as 'baixa' | 'media' | 'alta',
  })
  const { toast } = useToast()

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t))

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Título obrigatório', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase.from('ideas').insert({
          user_id: user.id,
          title: form.title,
          description: form.description,
          category_id: form.category_id || null,
          urgency: form.urgency,
          status: 'bruta',
        })
        if (error) throw error
      }

      toast({ title: 'Ideia salva!', description: `"${form.title}" adicionada à Caixa de Ideias.`, variant: 'success' })
      setOpen(false)
      setForm({ title: '', description: '', category_id: '', urgency: 'media' })
      setTags([])
    } catch {
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2">
        <div className="relative">
          <div className={cn(
            'absolute inset-0 rounded-full bg-gold-500/40 animate-pulse-ring',
            !open && 'block', open && 'hidden'
          )} />
          <button
            onClick={() => setOpen(true)}
            className={cn(
              'relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300',
              'bg-gradient-to-br from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500',
              'hover:scale-110 active:scale-95',
              open && 'rotate-180 scale-90 opacity-0 pointer-events-none'
            )}
            title="Nova ideia rápida"
          >
            <Lightbulb className="w-6 h-6 text-zinc-900" />
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gold-500/20">
                <Lightbulb className="w-4 h-4 text-gold-400" />
              </div>
              Nova Ideia Rápida
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="idea-title">Título *</Label>
              <Input
                id="idea-title"
                placeholder="Qual é a ideia?"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idea-desc">Descrição rápida</Label>
              <Textarea
                id="idea-desc"
                placeholder="Expanda um pouco mais..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_CATEGORIES.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Urgência</Label>
                <Select value={form.urgency} onValueChange={v => setForm(f => ({ ...f, urgency: v as 'baixa' | 'media' | 'alta' }))}>
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

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Amazonas, BR-319"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map(t => (
                    <Badge key={t} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeTag(t)}>
                      {t} <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Lightbulb className="w-4 h-4" /> Salvar ideia</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
