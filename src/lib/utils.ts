import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function formatDateShort(date: string | Date) {
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function estimateSpeechTime(wordCount: number): string {
  const wpm = 140
  const minutes = wordCount / wpm
  if (minutes < 1) return `${Math.round(minutes * 60)}s`
  const mins = Math.floor(minutes)
  const secs = Math.round((minutes - mins) * 60)
  return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export const URGENCY_LABELS: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
}

export const STATUS_LABELS: Record<string, string> = {
  bruta: 'Ideia Bruta',
  em_desenvolvimento: 'Em Desenvolvimento',
  transformada: 'Transformada',
  arquivada: 'Arquivada',
  rascunho: 'Rascunho',
  revisar: 'Revisar',
  pronto: 'Pronto para Gravar',
  gravado: 'Gravado',
  publicado: 'Publicado',
}

export const FORMAT_LABELS: Record<string, string> = {
  video: 'Vídeo',
  legenda: 'Legenda Instagram',
  discurso: 'Discurso',
  release: 'Release',
  story: 'Story',
  carrossel: 'Carrossel',
  audio: 'Áudio',
  site: 'Texto para Site',
}

export const TONE_LABELS: Record<string, string> = {
  firme: 'Firme',
  emocional: 'Emocional',
  institucional: 'Institucional',
  popular: 'Popular',
  provocativo: 'Provocativo',
  tecnico: 'Técnico',
  esperancoso: 'Esperançoso',
}

export const PRE_CAMPAIGN_WARNINGS = [
  'pedido explícito de voto',
  'vote em mim',
  'número de campanha',
  'meu número é',
  'candidate-se',
  'prometo que',
  'quando eleito',
  'quando for eleito',
  'propaganda eleitoral',
]

export function checkPreCampaign(text: string): string[] {
  const lower = text.toLowerCase()
  return PRE_CAMPAIGN_WARNINGS.filter(w => lower.includes(w))
}

export function generatePromptForAI(brainstorm: {
  central_idea: string
  problem_solved: string
  target_audience: string
  emotion: string
  impact_phrase: string
  main_arguments: string
  local_examples: string
  tone: string
  format: string
  free_notes: string
}): string {
  return `Você é um especialista em comunicação política e marketing público. Crie um texto de alta qualidade com base nas informações abaixo.

IDEIA CENTRAL: ${brainstorm.central_idea}
PROBLEMA QUE RESOLVE: ${brainstorm.problem_solved}
PÚBLICO-ALVO: ${brainstorm.target_audience}
EMOÇÃO QUE QUERO DESPERTAR: ${brainstorm.emotion}
FRASE DE IMPACTO: ${brainstorm.impact_phrase}
ARGUMENTOS PRINCIPAIS: ${brainstorm.main_arguments}
EXEMPLOS LOCAIS/REAIS: ${brainstorm.local_examples}
TOM: ${TONE_LABELS[brainstorm.tone] || brainstorm.tone}
FORMATO: ${FORMAT_LABELS[brainstorm.format] || brainstorm.format}
OBSERVAÇÕES: ${brainstorm.free_notes}

Por favor, entregue:

1. **TEXTO PRINCIPAL** — Com gancho inicial forte, desenvolvimento, argumentos e CTA (sem pedido explícito de voto, adequado para pré-campanha).
2. **VERSÃO PARA VÍDEO** — Roteiro com abertura, desenvolvimento e fechamento. Linguagem natural, como se estivesse falando.
3. **VERSÃO PARA LEGENDA** — Adaptada para Instagram, com emojis estratégicos e hashtags sugeridas.
4. **3 FRASES DE IMPACTO** — Curtas, diretas, memoráveis.
5. **SUGESTÃO DE CARROSSEL** — 5 a 7 slides com títulos e textos breves.

Tom geral: ${TONE_LABELS[brainstorm.tone] || brainstorm.tone}.
Linguagem: clara, próxima do povo do interior do Amazonas.
Evite jargões políticos excessivos.`
}
