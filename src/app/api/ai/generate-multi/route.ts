import { NextRequest, NextResponse } from 'next/server'
import { generateWithAI } from '@/lib/ai-service'
import type { GenerationType, AiProvider } from '@/types'

const DEFAULT_TYPES: GenerationType[] = [
  'roteiro_30s',
  'roteiro_60s',
  'legenda_instagram',
  'ideias_carrossel',
  'frases_impacto',
]

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      idea,
      brainstorm,
      types = DEFAULT_TYPES,
      provider,
    } = body as {
      idea?: { title: string; description?: string }
      brainstorm?: Parameters<typeof generateWithAI>[0]['brainstorm']
      types?: GenerationType[]
      provider?: AiProvider
    }

    if (!idea && !brainstorm) {
      return NextResponse.json(
        { error: 'envie "idea" ou "brainstorm"' },
        { status: 400 }
      )
    }

    const synthesizedBrainstorm = brainstorm ?? {
      central_idea: idea!.title,
      problem_solved: '',
      target_audience: '',
      emotion: '',
      impact_phrase: '',
      main_arguments: idea!.description ?? '',
      local_examples: '',
      tone: 'emocional',
      format: 'video',
      free_notes: '',
    }

    const results = await Promise.allSettled(
      types.map(type =>
        generateWithAI({ type, brainstorm: synthesizedBrainstorm, provider })
      )
    )

    const formats = types.map((type, i) => {
      const r = results[i]
      return r.status === 'fulfilled'
        ? { type, result: r.value, error: null }
        : { type, result: '', error: r.reason instanceof Error ? r.reason.message : 'Erro' }
    })

    return NextResponse.json({ formats })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
