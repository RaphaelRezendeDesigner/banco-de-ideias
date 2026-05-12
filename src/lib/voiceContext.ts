import type { VoiceSettings } from '@/types'

/**
 * Turns a VoiceSettings row into a string that gets injected
 * into every AI generation prompt.
 */
export function buildVoiceContext(v: Partial<VoiceSettings> | null | undefined): string {
  if (!v) return ''
  const lines: string[] = []
  if (v.candidate_name) lines.push(`Candidato: ${v.candidate_name}`)
  if (v.region_focus) lines.push(`Foco regional: ${v.region_focus}`)
  if (v.pautas?.length) lines.push(`Pautas e bandeiras prioritárias: ${v.pautas.join(' | ')}`)
  if (v.slogans?.length) lines.push(`Slogans (use ao menos um quando fizer sentido): ${v.slogans.join(' | ')}`)
  if (v.bordoes?.length) lines.push(`Bordões característicos: ${v.bordoes.join(' | ')}`)
  if (v.keywords?.length) lines.push(`Palavras-chave a tentar incluir: ${v.keywords.join(', ')}`)
  if (v.cta) lines.push(`CTA padrão para fechar peças: "${v.cta}"`)
  if (v.signoff) lines.push(`Assinatura/encerramento: "${v.signoff}"`)
  if (v.avoid) lines.push(`Evitar: ${v.avoid}`)
  return lines.length ? `\n\nVOZ DO CANDIDATO (use estes elementos quando fizer sentido):\n${lines.map(l => '- ' + l).join('\n')}` : ''
}
