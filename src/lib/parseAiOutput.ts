export interface ParsedStory {
  index: number
  phrase: string
  subtext: string
  visual: string
  tone: string
}

export interface ParsedSlide {
  index: number
  title: string
  text: string
  visual: string
}

/**
 * Parses the output of `frases_impacto` prompt into individual stories.
 * Expected pattern:
 *
 *   STORY 1
 *   Frase principal: "..."
 *   Subtexto (opcional): ...
 *   Sugestão visual: ...
 *   Tom: ...
 */
export function parseStories(text: string): ParsedStory[] {
  if (!text) return []
  // Split on lines starting with STORY <n>
  const blocks = text.split(/\n(?=STORY\s*\d)/i).filter(Boolean)
  const out: ParsedStory[] = []
  for (const raw of blocks) {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
    const indexMatch = lines[0]?.match(/STORY\s*(\d+)/i)
    if (!indexMatch) continue
    const index = Number(indexMatch[1])
    const get = (label: RegExp) => {
      const ln = lines.find(l => label.test(l))
      if (!ln) return ''
      return ln.replace(label, '').replace(/^[:\s]+/, '').replace(/^"|"$/g, '').trim()
    }
    out.push({
      index,
      phrase: get(/^Frase principal/i),
      subtext: get(/^Subtexto[^:]*/i),
      visual: get(/^Sugest[aã]o visual/i),
      tone: get(/^Tom/i),
    })
  }
  return out.filter(s => s.phrase)
}

/**
 * Parses `ideias_carrossel` prompt output into slides.
 * Expected pattern:
 *
 *   SLIDE 1
 *   Título: ...
 *   Texto: ...
 *   Visual: ...
 */
export function parseSlides(text: string): ParsedSlide[] {
  if (!text) return []
  const blocks = text.split(/\n(?=SLIDE\s*\d)/i).filter(Boolean)
  const out: ParsedSlide[] = []
  for (const raw of blocks) {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
    const indexMatch = lines[0]?.match(/SLIDE\s*(\d+)/i)
    if (!indexMatch) continue
    const index = Number(indexMatch[1])
    const get = (label: RegExp) => {
      const ln = lines.find(l => label.test(l))
      if (!ln) return ''
      return ln.replace(label, '').replace(/^[:\s]+/, '').replace(/^"|"$/g, '').trim()
    }
    out.push({
      index,
      title: get(/^T[ií]tulo/i),
      text: get(/^Texto/i),
      visual: get(/^Visual/i),
    })
  }
  return out.filter(s => s.title || s.text)
}

/**
 * Build a DALL-E 3 prompt for a story image (vertical 9:16).
 */
export function buildStoryImagePrompt(story: ParsedStory): string {
  return [
    'Instagram Story design, vertical 9:16 aspect ratio, modern professional political marketing graphic.',
    `Background: ${story.visual || 'gradient with brand colors'}.`,
    `Centered large bold text: "${story.phrase}".`,
    story.subtext ? `Smaller subtext below: "${story.subtext}".` : '',
    `Tone: ${story.tone || 'inspiracional'}.`,
    'Clean sans-serif typography, high contrast, ready to publish on Instagram. No watermark. No extra UI.',
  ].filter(Boolean).join(' ')
}

/**
 * Build a DALL-E 3 prompt for a carousel slide (1:1).
 */
export function buildSlideImagePrompt(slide: ParsedSlide, total: number): string {
  return [
    `Instagram carousel slide design, square 1:1 aspect ratio, slide ${slide.index} of ${total}.`,
    'Modern professional political marketing graphic.',
    `Visual concept: ${slide.visual || 'minimal background with brand color'}.`,
    `Bold title at top: "${slide.title}".`,
    slide.text ? `Body text: "${slide.text}".` : '',
    `Small indicator "${slide.index}/${total}" in the corner.`,
    'Clean sans-serif typography, high contrast, professional, ready to publish on Instagram. No watermark.',
  ].filter(Boolean).join(' ')
}

/**
 * A friendlier prompt for manual paste into ChatGPT / Gemini / etc.
 */
export function buildManualImagePrompt(
  kind: 'story' | 'slide',
  data: ParsedStory | ParsedSlide,
  total?: number
): string {
  if (kind === 'story') {
    const s = data as ParsedStory
    return `Crie uma imagem de Instagram Story (vertical 9:16, 1080x1920px), pronta para publicar, com design profissional e tipografia moderna.

Texto principal (grande, centralizado): "${s.phrase}"
${s.subtext ? `Subtexto: "${s.subtext}"` : ''}
Estilo visual: ${s.visual || 'gradiente moderno'}
Tom: ${s.tone || 'inspiracional'}

Importante: o texto principal precisa estar legível, sem erros de ortografia. Sem marca d'água.`
  }
  const s = data as ParsedSlide
  return `Crie uma imagem de slide de carrossel do Instagram (quadrado 1:1, 1080x1080px), pronta para publicar, com design profissional.

Slide ${s.index}${total ? ` de ${total}` : ''}
Título: "${s.title}"
${s.text ? `Texto do slide: "${s.text}"` : ''}
Estilo visual: ${s.visual || 'minimalista com cor de marca'}
Indicador no canto: "${s.index}${total ? `/${total}` : ''}"

Importante: textos precisam estar legíveis, sem erros de ortografia. Sem marca d'água.`
}
