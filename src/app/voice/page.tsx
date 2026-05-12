'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Megaphone, Loader2, Save, Plus, X, Info } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import type { VoiceSettings } from '@/types'

const EMPTY: VoiceSettings = {
  user_id: '',
  candidate_name: '',
  slogans: [],
  bordoes: [],
  keywords: [],
  pautas: [],
  cta: '',
  signoff: '',
  avoid: '',
  region_focus: 'Amazonas, interior do Amazonas',
  created_at: '',
  updated_at: '',
}

interface ChipFieldProps {
  label: string
  description: string
  placeholder: string
  values: string[]
  onChange: (next: string[]) => void
}

function ChipField({ label, description, placeholder, values, onChange }: ChipFieldProps) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (!v) return
    if (values.includes(v)) {
      setInput('')
      return
    }
    onChange([...values, v])
    setInput('')
  }
  const remove = (v: string) => onChange(values.filter(x => x !== v))
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground -mt-1">{description}</p>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); add() }
          }}
        />
        <Button type="button" variant="outline" onClick={add} disabled={!input.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {values.map(v => (
            <Badge key={v} variant="secondary" className="gap-1 pr-1">
              {v}
              <button
                onClick={() => remove(v)}
                className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                aria-label={`Remover ${v}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VoicePage() {
  const [voice, setVoice] = useState<VoiceSettings>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    const { data } = await supabase
      .from('voice_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (data) {
      setVoice({
        ...EMPTY,
        ...data,
        slogans: data.slogans ?? [],
        bordoes: data.bordoes ?? [],
        keywords: data.keywords ?? [],
        pautas: data.pautas ?? [],
      })
    } else {
      setVoice({ ...EMPTY, user_id: user.id })
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    const payload = {
      user_id: user.id,
      candidate_name: voice.candidate_name,
      slogans: voice.slogans,
      bordoes: voice.bordoes,
      keywords: voice.keywords,
      pautas: voice.pautas,
      cta: voice.cta,
      signoff: voice.signoff,
      avoid: voice.avoid,
      region_focus: voice.region_focus,
    }
    const { error } = await supabase
      .from('voice_settings')
      .upsert(payload, { onConflict: 'user_id' })
    setSaving(false)
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Voz do candidato atualizada!', variant: 'success' })
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-gold-400" />
            Voz do Candidato
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Esses elementos são injetados em <strong>toda</strong> geração de texto com IA.
          </p>
        </div>

        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 flex items-start gap-2 text-sm">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <div className="text-muted-foreground">
            A IA vai usar tudo o que estiver aqui como contexto — slogans, bordões, pautas, CTA preferido.
            Quanto mais específico, mais "com a cara do candidato" os textos ficam.
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identidade</CardTitle>
            <CardDescription>Quem é o candidato e onde ele atua.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do candidato</Label>
              <Input
                id="name"
                placeholder="Ex: João da Silva"
                value={voice.candidate_name}
                onChange={e => setVoice(v => ({ ...v, candidate_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Foco regional</Label>
              <Input
                id="region"
                placeholder="Ex: Amazonas, interior do Amazonas, BR-319"
                value={voice.region_focus}
                onChange={e => setVoice(v => ({ ...v, region_focus: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pautas e Bandeiras</CardTitle>
            <CardDescription>Temas que o candidato sempre defende. Use Enter pra adicionar.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChipField
              label="Pautas"
              description='Ex: "BR-319 trafegável o ano todo", "Regularização fundiária no interior", "Saúde indígena"'
              placeholder="Adicionar pauta..."
              values={voice.pautas}
              onChange={pautas => setVoice(v => ({ ...v, pautas }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Slogans e Bordões</CardTitle>
            <CardDescription>Frases que precisam reaparecer com naturalidade nos textos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChipField
              label="Slogans"
              description='Ex: "O Amazonas não pede favor — pede justiça"'
              placeholder="Adicionar slogan..."
              values={voice.slogans}
              onChange={slogans => setVoice(v => ({ ...v, slogans }))}
            />
            <ChipField
              label="Bordões"
              description='Frases curtas características. Ex: "Trabalho que se vê", "De olho no povo"'
              placeholder="Adicionar bordão..."
              values={voice.bordoes}
              onChange={bordoes => setVoice(v => ({ ...v, bordoes }))}
            />
            <ChipField
              label="Palavras-chave"
              description="Termos que devem aparecer com frequência. Ex: ribeirinho, Amazonas, BR-319, Manaus"
              placeholder="Adicionar palavra-chave..."
              values={voice.keywords}
              onChange={keywords => setVoice(v => ({ ...v, keywords }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fechamento Padrão</CardTitle>
            <CardDescription>Como cada peça deve terminar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cta">CTA padrão</Label>
              <Input
                id="cta"
                placeholder='Ex: "Siga se gostou do conteúdo. Compartilhe com quem precisa ver."'
                value={voice.cta}
                onChange={e => setVoice(v => ({ ...v, cta: e.target.value }))}
              />
              <p className="text-[11px] text-muted-foreground">
                Se vazio, a IA escolhe um CTA variado a cada peça (Siga / Comente / Compartilhe / Marque alguém).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signoff">Assinatura / encerramento</Label>
              <Input
                id="signoff"
                placeholder='Ex: "Pelo Amazonas que a gente quer."'
                value={voice.signoff}
                onChange={e => setVoice(v => ({ ...v, signoff: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">O que evitar</CardTitle>
            <CardDescription>Expressões, temas ou tom que a IA <strong>não</strong> deve usar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder='Ex: evitar palavrões, evitar tom agressivo, não citar adversários por nome, evitar termos técnicos demais...'
              value={voice.avoid}
              onChange={e => setVoice(v => ({ ...v, avoid: e.target.value }))}
              className="h-24"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end sticky bottom-4">
          <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Voz do Candidato
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
