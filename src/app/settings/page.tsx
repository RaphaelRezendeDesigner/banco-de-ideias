'use client'

import { useState, useEffect } from 'react'
import { Settings, ShieldAlert, Sparkles, Moon, Sun, Save, Loader2, Info, ExternalLink } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { getPreferredProvider, setPreferredProvider, PROVIDER_LABELS } from '@/lib/ai-preference'
import type { AiProvider } from '@/types'

export default function SettingsPage() {
  const [preCampaignMode, setPreCampaignMode] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [saving, setSaving] = useState(false)
  const [available, setAvailable] = useState<AiProvider[]>([])
  const [defaultProvider, setDefaultProvider] = useState<string>('none')
  const [chosen, setChosen] = useState<string>('none')
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [canvaStoryUrl, setCanvaStoryUrl] = useState('')
  const [canvaSlideUrl, setCanvaSlideUrl] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/ai/status')
        const json = await res.json()
        const av = (json.available ?? []) as AiProvider[]
        setAvailable(av)
        setDefaultProvider(json.default ?? 'none')
        const pref = getPreferredProvider()
        if (pref && av.includes(pref)) setChosen(pref)
        else setChosen(json.default ?? 'none')
      } catch {
        setAvailable([])
      } finally {
        setLoadingProviders(false)
      }
    })()
    // Load Canva template URLs from localStorage
    setCanvaStoryUrl(localStorage.getItem('canva_story_template') || '')
    setCanvaSlideUrl(localStorage.getItem('canva_slide_template') || '')
  }, [])

  const handleProviderChange = (value: string) => {
    setChosen(value)
    setPreferredProvider(value as AiProvider)
    toast({ title: `IA agora: ${PROVIDER_LABELS[value] || value}`, variant: 'success' })
  }

  const handleSaveCanva = () => {
    if (canvaStoryUrl) localStorage.setItem('canva_story_template', canvaStoryUrl)
    else localStorage.removeItem('canva_story_template')
    if (canvaSlideUrl) localStorage.setItem('canva_slide_template', canvaSlideUrl)
    else localStorage.removeItem('canva_slide_template')
    toast({ title: 'Templates do Canva salvos!', variant: 'success' })
  }

  const handleSave = async () => {
    setSaving(true)
    handleSaveCanva()
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast({ title: 'Configurações salvas!', variant: 'success' })
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-gold-400" />
            Configurações
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Personalize o Banco de Ideias</p>
        </div>

        {/* Pré-campanha */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Modo Pré-Campanha
            </CardTitle>
            <CardDescription>
              Ativa alertas para evitar expressões que possam caracterizar propaganda eleitoral antecipada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Ativar Modo Pré-Campanha</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Exibe aviso no cabeçalho e alerta sobre frases como "vote em mim", número de campanha, etc.
                </p>
              </div>
              <Switch checked={preCampaignMode} onCheckedChange={setPreCampaignMode} />
            </div>

            {preCampaignMode && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                <p className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Expressões monitoradas
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 pl-2">
                  <li>• Pedido explícito de voto</li>
                  <li>• Número de campanha</li>
                  <li>• "Vote em mim" / "vote em [nome]"</li>
                  <li>• Promessa direta de cargo</li>
                  <li>• "Quando eleito" / "quando for eleito"</li>
                  <li>• Propaganda eleitoral antecipada</li>
                </ul>
                <p className="text-[11px] text-muted-foreground italic mt-2">
                  Este modo não substitui análise jurídica. Consulte sempre um advogado eleitoral.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* IA */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-400" />
              Integração com IA
            </CardTitle>
            <CardDescription>
              Escolha o provedor de IA para geração de textos diretamente no app.
              As chaves são configuradas via variáveis de ambiente no servidor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingProviders ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando provedores configurados...
              </div>
            ) : available.length === 0 ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                <p className="font-medium text-amber-400">Nenhum provedor de IA configurado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No Vercel, adicione pelo menos uma das chaves: <code>OPENAI_API_KEY</code>, <code>ANTHROPIC_API_KEY</code> ou <code>GEMINI_API_KEY</code>.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Usar IA</Label>
                  <Select value={chosen} onValueChange={handleProviderChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {available.map(p => (
                        <SelectItem key={p} value={p}>
                          {PROVIDER_LABELS[p] || p}
                          {p === defaultProvider && ' (padrão do servidor)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Sua escolha fica salva neste navegador. Mudar não exige redeploy.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Provedores disponíveis no servidor</p>
                  <ul className="text-xs space-y-1">
                    {available.map(p => (
                      <li key={p} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        {PROVIDER_LABELS[p] || p}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Canva */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <svg className="w-4 h-4 text-[#8B3DFF]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 2.4c5.304 0 9.6 4.296 9.6 9.6s-4.296 9.6-9.6 9.6S2.4 17.304 2.4 12 6.696 2.4 12 2.4zm-.36 3.84c-1.584 0-2.88.576-3.888 1.728C6.744 9.12 6.24 10.488 6.24 12.12c0 1.608.504 2.904 1.512 3.888 1.008.984 2.256 1.476 3.744 1.476.888 0 1.692-.18 2.412-.54.72-.36 1.296-.876 1.728-1.548l-1.44-.984c-.6.864-1.44 1.296-2.52 1.296-.888 0-1.632-.3-2.232-.9-.6-.6-.9-1.392-.9-2.376 0-1.008.3-1.824.9-2.448.6-.624 1.368-.936 2.304-.936 1.008 0 1.8.408 2.376 1.224l1.44-.984c-.456-.648-1.02-1.14-1.692-1.476-.672-.336-1.404-.504-2.196-.504z"/>
              </svg>
              Integração com Canva
            </CardTitle>
            <CardDescription>
              Configure seus templates do Canva. Ao clicar em &quot;Criar no Canva&quot;, o texto é copiado automaticamente e o template abre em nova aba.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-[#8B3DFF]/20 bg-[#8B3DFF]/5 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Como configurar:</p>
              <ol className="space-y-0.5 pl-3 list-decimal">
                <li>Crie um template de Story e um de Carrossel no Canva</li>
                <li>Abra o design → copie o link de edição (botão &quot;Compartilhar&quot; → &quot;Link de edição&quot;)</li>
                <li>Cole os links abaixo e salve</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Template Story (vertical 9:16)
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.canva.com/design/DAH.../edit"
                  value={canvaStoryUrl}
                  onChange={e => setCanvaStoryUrl(e.target.value)}
                  className="text-xs"
                />
                {canvaStoryUrl && (
                  <Button size="sm" variant="outline" className="shrink-0" onClick={() => window.open(canvaStoryUrl, '_blank')}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Template Carrossel (quadrado 1:1)
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.canva.com/design/DAH.../edit"
                  value={canvaSlideUrl}
                  onChange={e => setCanvaSlideUrl(e.target.value)}
                  className="text-xs"
                />
                {canvaSlideUrl && (
                  <Button size="sm" variant="outline" className="shrink-0" onClick={() => window.open(canvaSlideUrl, '_blank')}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleSaveCanva}>
              <Save className="w-3.5 h-3.5" />
              Salvar templates do Canva
            </Button>
          </CardContent>
        </Card>

        {/* Aparência */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Tema Escuro</p>
                <p className="text-xs text-muted-foreground">Tema principal do app</p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={v => setTheme(v ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Conta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value="usuario@exemplo.com" disabled />
            </div>
            <Separator />
            <Button variant="destructive" size="sm">
              Sair da conta
            </Button>
          </CardContent>
        </Card>

        <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar configurações
        </Button>
      </div>
    </AppLayout>
  )
}
