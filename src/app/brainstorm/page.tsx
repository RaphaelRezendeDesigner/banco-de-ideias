'use client'

import { useState } from 'react'
import { Brain, Sparkles, FileText } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { BrainstormForm } from '@/components/BrainstormForm'
import { TextEditor } from '@/components/TextEditor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function BrainstormPage() {
  const [generatedText, setGeneratedText] = useState('')
  const [tab, setTab] = useState('form')
  const { toast } = useToast()

  const hasAiConfigured = !!(process.env.NEXT_PUBLIC_AI_PROVIDER && process.env.NEXT_PUBLIC_AI_PROVIDER !== 'none')

  const handleSave = async (data: object) => {
    console.log('Salvando brainstorm:', data)
    await new Promise(r => setTimeout(r, 800))
  }

  const handleGenerateText = async (data: object) => {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'roteiro_60s', brainstorm: data }),
    })
    if (!response.ok) throw new Error(await response.text())
    const { result } = await response.json()
    setGeneratedText(result)
    setTab('result')
    toast({ title: 'Texto gerado!', variant: 'success' })
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-gold-400" />
              Brainstorm Guiado
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Organize sua ideia antes de transformar em texto
            </p>
          </div>
          {!hasAiConfigured && (
            <Badge variant="outline" className="hidden sm:flex text-xs gap-1">
              <Sparkles className="w-3 h-3" />
              IA não configurada
            </Badge>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="form" className="gap-2">
              <Brain className="w-3.5 h-3.5" />
              Formulário
            </TabsTrigger>
            <TabsTrigger value="result" className="gap-2" disabled={!generatedText}>
              <FileText className="w-3.5 h-3.5" />
              Resultado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="mt-6">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-base text-muted-foreground font-normal">
                  Preencha os campos abaixo para estruturar seu pensamento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <BrainstormForm
                  onSave={handleSave}
                  onGenerateText={handleGenerateText}
                  hasAiConfigured={hasAiConfigured}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="result" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-400" />
                  Texto Gerado pela IA
                </h2>
              </div>
              <TextEditor
                value={generatedText}
                onChange={setGeneratedText}
                className="min-h-[400px]"
                placeholder="O texto gerado aparecerá aqui..."
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
