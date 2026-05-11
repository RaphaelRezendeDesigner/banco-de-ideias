import type { AiProvider } from '@/types'

const KEY = 'banco-de-ideias:ai-provider'

export function getPreferredProvider(): AiProvider | null {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(KEY)
  if (v === 'openai' || v === 'anthropic' || v === 'gemini') return v
  return null
}

export function setPreferredProvider(provider: AiProvider | null) {
  if (typeof window === 'undefined') return
  if (!provider || provider === 'none') {
    window.localStorage.removeItem(KEY)
  } else {
    window.localStorage.setItem(KEY, provider)
  }
}

export const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI (GPT-4o)',
  anthropic: 'Anthropic (Claude Sonnet)',
  gemini: 'Google Gemini 2.0 Flash (grátis)',
}
