'use client'

import { useState } from 'react'
import { Loader2, Image as ImageIcon, Download, Copy, ExternalLink, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  parseStories, parseSlides,
  buildStoryImagePrompt, buildSlideImagePrompt,
  buildManualImagePrompt,
  type ParsedStory, type ParsedSlide,
} from '@/lib/parseAiOutput'

interface Props {
  kind: 'story' | 'slide'
  content: string
  /** Used to build the filename prefix and total count for slide indicators. */
  titleHint?: string
}

export function AiImageGallery({ kind, content, titleHint }: Props) {
  const items = kind === 'story' ? parseStories(content) : parseSlides(content)
  const total = items.length
  const [images, setImages] = useState<Map<number, string>>(new Map()) // index -> data URL
  const [errors, setErrors] = useState<Map<number, string>>(new Map())
  const [busy, setBusy] = useState<Set<number>>(new Set())
  const [busyAll, setBusyAll] = useState(false)
  const { toast } = useToast()

  if (items.length === 0) {
    return (
      <div className="p-3 text-xs text-muted-foreground bg-muted/30 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5" />
        Não consegui detectar {kind === 'story' ? 'stories' : 'slides'} no texto gerado. Tente regenerar o formato.
      </div>
    )
  }

  const promptFor = (item: ParsedStory | ParsedSlide) =>
    kind === 'story'
      ? buildStoryImagePrompt(item as ParsedStory)
      : buildSlideImagePrompt(item as ParsedSlide, total)

  const generateOne = async (item: ParsedStory | ParsedSlide) => {
    setBusy(prev => new Set(prev).add(item.index))
    setErrors(prev => {
      const next = new Map(prev)
      next.delete(item.index)
      return next
    })
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptFor(item),
          size: kind === 'story' ? '1024x1792' : '1024x1024',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro na geração')
      const dataUrl = `data:image/png;base64,${json.b64}`
      setImages(prev => new Map(prev).set(item.index, dataUrl))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro'
      setErrors(prev => new Map(prev).set(item.index, message))
      toast({ title: `Erro no ${kind} ${item.index}`, description: message, variant: 'destructive' })
    } finally {
      setBusy(prev => {
        const next = new Set(prev)
        next.delete(item.index)
        return next
      })
    }
  }

  const generateAll = async () => {
    setBusyAll(true)
    // Limit to 3 in parallel to be friendly with DALL-E rate limits.
    const queue = items.filter(i => !images.has(i.index))
    const concurrency = 3
    for (let i = 0; i < queue.length; i += concurrency) {
      await Promise.all(queue.slice(i, i + concurrency).map(generateOne))
    }
    setBusyAll(false)
    toast({ title: 'Imagens prontas!', description: 'Use o botão Baixar em cada uma.', variant: 'success' })
  }

  const slug = (titleHint || (kind === 'story' ? 'story' : 'slide')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)

  const download = (item: ParsedStory | ParsedSlide) => {
    const dataUrl = images.get(item.index)
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${slug || kind}-${kind}-${item.index}.png`
    a.click()
  }

  const downloadAll = () => {
    images.forEach((_url, idx) => {
      const item = items.find(i => i.index === idx)
      if (item) download(item)
    })
  }

  const copyManualPrompt = async (item: ParsedStory | ParsedSlide) => {
    const prompt = buildManualImagePrompt(kind, item, total)
    await navigator.clipboard.writeText(prompt)
    toast({
      title: 'Prompt copiado!',
      description: 'Cole no ChatGPT / Gemini / Imagem do Claude para gerar a imagem manualmente.',
      variant: 'success',
    })
  }

  const openChatGPT = () => {
    window.open('https://chatgpt.com/?model=gpt-4o', '_blank', 'noopener,noreferrer')
  }

  const generatedCount = images.size

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap rounded-lg border border-border bg-muted/20 p-3">
        <div className="text-xs text-muted-foreground">
          {items.length} {kind === 'story' ? 'stories' : 'slides'} detectados ·
          {' '}<span className="text-foreground font-medium">{generatedCount}</span> com imagem
        </div>
        <div className="flex items-center gap-2">
          {generatedCount > 0 && (
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={downloadAll}>
              <Download className="w-3 h-3" /> Baixar tudo
            </Button>
          )}
          <Button
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={generateAll}
            disabled={busyAll || generatedCount === items.length}
          >
            {busyAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
            Gerar todas as imagens com IA
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground px-1">
        💡 IA da OpenAI (DALL-E 3) custa ~$0.04 por imagem. {items.length} × $0.04 = ~$
        {(items.length * 0.04).toFixed(2)} para gerar tudo.
        Como alternativa <strong>gratuita</strong>, copie o prompt e cole no seu ChatGPT/Gemini que você já paga.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {items.map(item => {
          const isBusy = busy.has(item.index)
          const dataUrl = images.get(item.index)
          const err = errors.get(item.index)
          return (
            <div key={item.index} className="rounded-lg border border-border overflow-hidden bg-card">
              {/* Preview area */}
              <div
                className={
                  kind === 'story'
                    ? 'aspect-[9/16] bg-muted/30 relative flex items-center justify-center'
                    : 'aspect-square bg-muted/30 relative flex items-center justify-center'
                }
              >
                {dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dataUrl} alt={`${kind} ${item.index}`} className="w-full h-full object-cover" />
                ) : isBusy ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs">Gerando...</span>
                  </div>
                ) : err ? (
                  <div className="p-3 text-xs text-destructive text-center">
                    <AlertCircle className="w-4 h-4 mx-auto mb-1" />
                    {err}
                  </div>
                ) : (
                  <div className="p-3 text-center space-y-2">
                    <ImageIcon className="w-5 h-5 mx-auto text-muted-foreground/60" />
                    <p className="text-xs font-medium text-foreground line-clamp-3">
                      {kind === 'story'
                        ? (item as ParsedStory).phrase
                        : (item as ParsedSlide).title}
                    </p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {kind === 'story'
                        ? (item as ParsedStory).visual
                        : (item as ParsedSlide).visual}
                    </p>
                  </div>
                )}
                <div className="absolute top-1.5 left-1.5 text-[10px] font-medium bg-zinc-900/70 text-white rounded px-1.5 py-0.5">
                  {kind === 'story' ? `Story ${item.index}` : `Slide ${item.index}/${total}`}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 p-2 border-t border-border/50 flex-wrap">
                {dataUrl ? (
                  <Button size="sm" variant="default" className="h-7 text-xs gap-1 flex-1" onClick={() => download(item)}>
                    <Download className="w-3 h-3" /> Baixar PNG
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    className="h-7 text-xs gap-1 flex-1"
                    onClick={() => generateOne(item)}
                    disabled={isBusy}
                  >
                    {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                    Gerar com IA
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => copyManualPrompt(item)}
                  title="Copiar prompt para gerar manualmente no ChatGPT/Gemini"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={openChatGPT}
                  title="Abrir ChatGPT em nova aba"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
