import { NextRequest, NextResponse } from 'next/server'
import { generateRawWithAI } from '@/lib/ai-service'
import type { AiProvider } from '@/types'

export const maxDuration = 60

interface SuggestedIdea {
  title: string
  description: string
  urgency: 'baixa' | 'media' | 'alta'
  suggested_category?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      count = 5,
      voiceContext = '',
      provider,
      recentIdeas = [],
      categories = [],
    } = body as {
      count?: number
      voiceContext?: string
      provider?: AiProvider
      recentIdeas?: { title: string }[]
      categories?: { name: string }[]
    }

    const n = Math.max(1, Math.min(10, count))
    const recentBlock = recentIdeas.length
      ? `\nIdeias já no banco (NÃO repita ou parafraseie):\n${recentIdeas.slice(0, 20).map(i => `- ${i.title}`).join('\n')}`
      : ''
    const categoriesBlock = categories.length
      ? `\nCategorias disponíveis:\n${categories.map(c => `- ${c.name}`).join('\n')}`
      : ''

    const prompt = `Você é um estrategista de comunicação política. Gere ${n} ideias NOVAS para conteúdo do candidato, alinhadas com a voz e as pautas dele.

${voiceContext || 'Foco: Amazonas, interior, comunicação política responsável.'}

${recentBlock}${categoriesBlock}

REGRAS:
- Cada ideia deve ser ORIGINAL e não repetir as do banco.
- Foco em pautas que o candidato defende (ver Voz do Candidato acima).
- Conectar com o cotidiano do Amazonas / interior, datas, contextos atuais quando possível.
- Variar formatos sugeridos: indignação social, dado surpreendente, história pessoal, comparação, denúncia, esperança.
- SEM pedir voto, SEM número de campanha.

Entregue EXATAMENTE neste formato, repetido ${n} vezes:

IDEIA [N]
Título: <título curto e instigante, até 12 palavras>
Descrição: <2-3 frases explicando o ângulo, o público e o gancho>
Urgência: <baixa | media | alta>
Categoria sugerida: <um dos nomes da lista acima, ou "" se nenhuma se encaixa>
`

    const raw = await generateRawWithAI(prompt, provider)

    // Parse the raw output
    const ideas = parseIdeas(raw, n)
    return NextResponse.json({ ideas })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Strips common markdown decorations and whitespace so simple regexes
 * can match field labels regardless of how the model formatted them.
 */
function normalize(line: string): string {
  return line
    .replace(/^[\s>#*_-]+/, '')      // leading bullets, headings, blockquotes, asterisks
    .replace(/[*_]+$/, '')           // trailing asterisks / underscores
    .replace(/^\*\*(.+?)\*\*/, '$1') // **bold:** -> bold:
    .replace(/^__(.+?)__/, '$1')
    .trim()
}

function parseIdeas(text: string, expected: number): SuggestedIdea[] {
  if (!text) return []

  // Normalize the whole text line-by-line first so the split sees clean markers.
  const cleaned = text
    .split('\n')
    .map(normalize)
    .join('\n')

  // Split on "IDEIA N", "Ideia N", "IDEA N", or numbered list ("1.", "1)") at line start.
  const blocks = cleaned
    .split(/\n(?=(?:IDEIA|IDEA)\s*\d|\d+[.)]\s)/i)
    .filter(b => /(?:IDEIA|IDEA)\s*\d|\d+[.)]\s/i.test(b))

  const out: SuggestedIdea[] = []
  for (const raw of blocks) {
    const lines = raw.split('\n').map(normalize).filter(Boolean)
    const get = (label: RegExp) => {
      const ln = lines.find(l => label.test(l))
      if (!ln) return ''
      return ln
        .replace(label, '')
        .replace(/^[:\s*]+/, '')
        .replace(/[*_]+$/, '')
        .replace(/^"|"$/g, '')
        .trim()
    }
    const title = get(/^\**\s*T[ií]tulo/i)
    const description = get(/^\**\s*Descri[cç][aã]o/i)
    const urgencyRaw = get(/^\**\s*Urg[eê]ncia/i).toLowerCase()
    const urgency: 'baixa' | 'media' | 'alta' =
      urgencyRaw.startsWith('alt') ? 'alta'
      : urgencyRaw.startsWith('baix') ? 'baixa'
      : 'media'
    const suggested_category = get(/^\**\s*Categoria(\s+sugerida)?/i)
    if (title) out.push({ title, description, urgency, suggested_category })
    if (out.length >= expected) break
  }
  return out
}
