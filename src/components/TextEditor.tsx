'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Save, Copy, Download, Clock, Hash, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { countWords, estimateSpeechTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface TextEditorProps {
  value: string
  onChange: (value: string) => void
  onSave?: (value: string) => Promise<void>
  placeholder?: string
  className?: string
  autoSave?: boolean
}

export function TextEditor({ value, onChange, onSave, placeholder, className, autoSave = true }: TextEditorProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { toast } = useToast()
  const wordCount = countWords(value)
  const speechTime = estimateSpeechTime(wordCount)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const handleSave = useCallback(async () => {
    if (!onSave || !value.trim()) return
    setSaving(true)
    try {
      await onSave(value)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }, [onSave, value, toast])

  // Auto-save
  useEffect(() => {
    if (!autoSave || !onSave) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(handleSave, 2000)
    return () => clearTimeout(saveTimerRef.current)
  }, [value, autoSave, onSave, handleSave])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    toast({ title: 'Texto copiado!', variant: 'success' })
  }

  const handleDownload = (format: 'txt' | 'md') => {
    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `texto.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn('flex flex-col border border-border rounded-xl overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {wordCount} palavras
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ~{speechTime}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleCopy}>
            <Copy className="w-3 h-3" />
            Copiar
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleDownload('txt')}>
            <Download className="w-3 h-3" />
            .txt
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleDownload('md')}>
            <Download className="w-3 h-3" />
            .md
          </Button>
          {onSave && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleSave}
              disabled={saving}
              variant={saved ? 'outline' : 'default'}
            >
              {saving ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Salvando</>
              ) : saved ? (
                <><CheckCircle className="w-3 h-3 text-emerald-400" /> Salvo</>
              ) : (
                <><Save className="w-3 h-3" /> Salvar</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Editor area */}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Comece a escrever...'}
        className="flex-1 w-full min-h-[320px] p-4 bg-background text-foreground text-sm leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground font-mono"
        spellCheck
      />
    </div>
  )
}
