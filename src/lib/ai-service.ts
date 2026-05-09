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
  return `Crie 10 frases de impacto sobre o tema abaixo, para uso em comunicação política.
Contexto:${contextBlock(p)}

Requisitos:
- Cada frase deve ter no máximo 15 palavras
- Linguagem direta e memorável
- Sem pedido de voto
- Variadas em tom: inspiracional, factual, provocativo
- Adequadas para artes, stories e vídeos curtos`
}

function buildCarousel(p: GenerateParams): string {
  return `Crie um roteiro de carrossel para Instagram com 7 slides.
Contexto:${contextBlock(p)}

Para cada slide entregue:
- Número do slide
- Título (até 6 palavras)
- Texto do slide (até 30 palavras)
- Sugestão de elemento visual

Slide 1: Capa com frase-gancho
Slides 2-6: Desenvolvimento
Slide 7: CTA e informação de contato`
}

export async function generateWithAI(params: GenerateParams): Promise<string> {
  const provider = process.env.AI_PROVIDER as 'openai' | 'anthropic' | 'none' | undefined
  const prompt = GENERATION_PROMPTS[params.type](params)

  if (!provider || provider === 'none') {
    throw new Error('AI_PROVIDER não configurado. Configure OPENAI_API_KEY ou ANTHROPIC_API_KEY no .env')
  }

  if (provider === 'openai') {
    return generateWithOpenAI(prompt)
  }

  if (provider === 'anthropic') {
    return generateWithAnthropic(prompt)
  }

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

export function getPromptOnly(params: GenerateParams): string {
  return GENERATION_PROMPTS[params.type](params)
}
