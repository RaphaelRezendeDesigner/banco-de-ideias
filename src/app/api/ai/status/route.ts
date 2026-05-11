import { NextResponse } from 'next/server'
import { listAvailableProviders } from '@/lib/ai-service'

export async function GET() {
  const available = listAvailableProviders()
  const defaultProvider =
    (process.env.AI_PROVIDER || process.env.NEXT_PUBLIC_AI_PROVIDER || 'none') as string
  return NextResponse.json({
    available,
    default: available.includes(defaultProvider as 'openai' | 'anthropic' | 'gemini')
      ? defaultProvider
      : (available[0] ?? 'none'),
  })
}
