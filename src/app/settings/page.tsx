'use client'

import { useState } from 'react'
import { Settings, ShieldAlert, Sparkles, Moon, Sun, Save, Loader2, Info } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'

export default function SettingsPage() {
  const [preCampaignMode, setPreCampaignMode] = useState(false)
  const [aiProvider, setAiProvider] = useState('none')
  const [theme, setTheme] = useState('dark')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setSaving(true)
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
            <div className="space-y-2">
              <Label>Provedor de IA</Label>
              <Select value={aiProvider} onValueChange={setAiProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem IA integrada (copiar prompt)</SelectItem>
                  <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude Sonnet)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {aiProvider !== 'none' && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
                <p className="text-xs font-medium">Configuração necessária no servidor</p>
                {aiProvider === 'openai' && (
                  <code className="text-xs text-gold-400 block">OPENAI_API_KEY=sk-...</code>
                )}
                {aiProvider === 'anthropic' && (
                  <code className="text-xs text-gold-400 block">ANTHROPIC_API_KEY=sk-ant-...</code>
                )}
                <code className="text-xs text-gold-400 block">AI_PROVIDER={aiProvider}</code>
                <p className="text-[11px] text-muted-foreground">
                  Adicione essas variáveis ao arquivo <code>.env.local</code> e reinicie o servidor.
                </p>
              </div>
            )}
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
