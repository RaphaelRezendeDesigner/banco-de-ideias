import { NextRequest, NextResponse } from 'next/server'
import { generateWithAI } from '@/lib/ai-service'
import type { GenerationType, AiProvider } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, brainstorm, context, provider, slideCount, storyCount } = body as {
      type: GenerationType
      brainstorm?: object
      context?: string
      provider?: AiProvider
      slideCount?: number
      storyCount?: number
    }

    if (!type) {
      return NextResponse.json({ error: 'type é obrigatório' }, { status: 400 })
    }

    const result = await generateWithAI({
      type,
      brainstorm: brainstorm as Parameters<typeof generateWithAI>[0]['brainstorm'],
      context,
      provider,
      slideCount,
      storyCount,
    })
    return NextResponse.json({ result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
