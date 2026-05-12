import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

type Size = '1024x1024' | '1024x1792' | '1792x1024'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, size = '1024x1024', quality = 'standard' } = body as {
      prompt: string
      size?: Size
      quality?: 'standard' | 'hd'
    }

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'prompt obrigatório' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY não configurada. Geração de imagem requer OpenAI.' },
        { status: 400 }
      )
    }

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality,
        response_format: 'b64_json',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `OpenAI: ${err}` }, { status: 500 })
    }

    const data = await res.json()
    const b64 = data.data?.[0]?.b64_json
    if (!b64) {
      return NextResponse.json({ error: 'Resposta sem imagem' }, { status: 500 })
    }
    return NextResponse.json({ b64, size })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
