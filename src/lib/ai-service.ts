import type { GenerationType } from '@/types'

interface GenerateParams {
  type: GenerationType
  brainstorm?: {
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
  }
  context?: string
  // Optional per-format tuning
  slideCount?: number   // for ideias_carrossel (3, 5, 7, 9...)
  storyCount?: number   // for frases_impacto (number of story options)
}

const GENERATION_PROMPTS: Record<GenerationType, (params: GenerateParams) => string> = {
  roteiro_30s: (p) => buildScript(p, 30),
  roteiro_45s: (p) => buildScript(p, 45),
  roteiro_60s: (p) => buildScript(p, 60),
  legenda_instagram: (p) => buildInstagram(p),
  texto_institucional: (p) => buildInstitutional(p),
  release: (p) => buildRelease(p),
  discurso_curto: (p) => buildSpeech(p),
  frases_impacto: (p) => buildImpactPhrases(p),
  ideias_carrossel: (p) => buildCarousel(p),
}

function contextBlock(p: GenerateParams): string {
  if (!p.brainstorm) return p.context || ''
  const b = p.brainstorm
  return `
Ideia Central: ${b.central_idea}
Problema: ${b.problem_solved}
Público: ${b.target_audience}
Emoção: ${b.emotion}
Frase de Impacto: ${b.impact_phrase}
Argumentos: ${b.main_arguments}
Exemplos: ${b.local_examples}
Tom: ${b.tone}
Observações: ${b.free_notes}`
}

function buildScript(p: GenerateParams, seconds: number): string {
  const words = Math.round((seconds / 60) * 140)
  return `Crie um roteiro de vídeo de ${seconds} segundos (aproximadamente ${words} palavras) para comunicação política.
Contexto:${contextBlock(p)}

Estrutura obrigatória:
- ABERTURA (gancho forte, primeiros 3 segundos)
- DESENVOLVIMENTO (argumento central)
- FECHAMENTO (chamada para reflexão, sem pedido de voto)

Linguagem: natural, próxima, para o interior do Amazonas.
Formato: texto corrido para leitura em câmera.`
}

function buildInstagram(p: GenerateParams): string {
  return `Crie uma legenda para Instagram sobre comunicação política/mandato.
Contexto:${contextBlock(p)}

Entregue:
- Legenda principal (até 2200 caracteres)
- Linha de abertura que prende (primeiras 2 linhas visíveis)
- Uso estratégico de emojis
- 10 hashtags relevantes (mix de amplo e nicho)
- Sugestão de CTA sem pedido de voto`
}

function buildInstitutional(p: GenerateParams): string {
  return `Crie um texto institucional formal sobre comunicação de mandato/gestão pública.
Contexto:${contextBlock(p)}

Formato: texto corrido com 3 a 4 parágrafos.
Tom: sério, profissional, mas acessível.
Sem pedido de voto ou propaganda eleitoral.`
}

function buildRelease(p: GenerateParams): string {
  return `Crie um release jornalístico para imprensa regional.
Contexto:${contextBlock(p)}

Estrutura:
- Título (objetivo, factual)
- Subtítulo
- Lead (quem, o quê, quando, onde, por quê)
- Desenvolvimento (2 parágrafos)
- Citação entre aspas de um parlamentar/gestor
- Informações de contato placeholder

Linguagem: jornalística, objetiva, 3ª pessoa.`
}

function buildSpeech(p: GenerateParams): string {
  return `Crie um discurso curto (2 a 3 minutos de fala, cerca de 300 palavras) para comunicação política.
Contexto:${contextBlock(p)}

Estrutura:
- Saudação inicial
- Gancho emocional
- Argumento central
- Exemplos concretos
- Encerramento inspirador

Tom: próximo, humanizado, que conecta com o interior do Amazonas.`
}

function buildImpactPhrases(p: GenerateParams): string {
  const count = p.storyCount && p.storyCount > 0 ? p.storyCount : 5
  return `Crie ${count} stories prontos para postar no Instagram a partir do tema abaixo.
Contexto:${contextBlock(p)}

Entregue cada story numerado de 1 a ${count}, no formato:

STORY [N]
Frase principal: "<frase de impacto, até 15 palavras>"
Subtexto (opcional): <complemento curto ou hashtag>
Sugestão visual: <fundo, foto, cor ou elemento gráfico>
Tom: <inspiracional | factual | provocativo | emocional>

Regras:
- Frases prontas para virar arte de story (não precisam ser editadas)
- Variadas em tom entre os ${count} stories
- Sem pedido de voto, sem número de campanha
- Linguagem direta, memorável, próxima do interior do Amazonas
- Cada story deve funcionar isolado (não dependem uns dos outros)`
}

function buildCarousel(p: GenerateParams): string {
  const slides = p.slideCount && p.slideCount > 0 ? p.slideCount : 7
  return `Crie um carrossel para Instagram com exatamente ${slides} slides sobre o tema abaixo.
Contexto:${contextBlock(p)}

Estrutura obrigatória:
- Slide 1: Capa com frase-gancho forte (parar o scroll)
${slides > 2 ? `- Slides 2 a ${slides - 1}: Desenvolvimento progressivo do argumento\n` : ''}- Slide ${slides}: CTA + informação de contato (sem pedido de voto)

Entregue cada slide EXATAMENTE neste formato (mesmas chaves, em português):

SLIDE [N]
Título: <até 6 palavras>
Texto: <até 30 palavras>
Visual: <sugestão de fundo, foto, cor ou ícone>

Repita para os ${slides} slides. Linguagem natural, próxima do interior do Amazonas. Cada slide funciona isolado.`
}

type ProviderName = 'openai' | 'anthropic' | 'gemini' | 'none'

export function listAvailableProviders(): ProviderName[] {
  const out: ProviderName[] = []
  if (process.env.OPENAI_API_KEY) out.push('openai')
  if (process.env.ANTHROPIC_API_KEY) out.push('anthropic')
  if (process.env.GEMINI_API_KEY) out.push('gemini')
  return out
}

export async function generateWithAI(params: GenerateParams & { provider?: ProviderName }): Promise<string> {
  const envProvider = (process.env.AI_PROVIDER || process.env.NEXT_PUBLIC_AI_PROVIDER) as ProviderName | undefined
  const requested = params.provider && params.provider !== 'none' ? params.provider : envProvider
  const prompt = GENERATION_PROMPTS[params.type](params)

  // Validate the requested provider has its key. If not, fall back to any configured one.
  const available = listAvailableProviders()
  let chosen: ProviderName | undefined = requested && available.includes(requested) ? requested : undefined
  if (!chosen) chosen = available[0]

  if (!chosen) {
    throw new Error('IA não configurada. No Vercel, defina pelo menos uma variável: GEMINI_API_KEY, OPENAI_API_KEY ou ANTHROPIC_API_KEY.')
  }

  if (chosen === 'openai') return generateWithOpenAI(prompt)
  if (chosen === 'anthropic') return generateWithAnthropic(prompt)
  if (chosen === 'gemini') return generateWithGemini(prompt)

  throw new Error('Provedor de IA inválido')
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.8,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI erro: ${err}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

async function generateWithAnthropic(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic erro: ${err}`)
  }

  const data = await response.json()
  return data.content[0]?.text || ''
}

async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.8 },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini erro: ${err}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export function getPromptOnly(params: GenerateParams): string {
  return GENERATION_PROMPTS[params.type](params)
}
