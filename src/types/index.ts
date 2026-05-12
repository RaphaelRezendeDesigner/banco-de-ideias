export type IdeaStatus = 'bruta' | 'em_desenvolvimento' | 'transformada' | 'arquivada'
export type UrgencyLevel = 'baixa' | 'media' | 'alta'
export type TextStatus = 'rascunho' | 'revisar' | 'pronto' | 'gravado' | 'publicado' | 'arquivado'
export type TextFormat = 'video' | 'legenda' | 'discurso' | 'release' | 'story' | 'carrossel' | 'audio' | 'site'
export type ContentTone = 'firme' | 'emocional' | 'institucional' | 'popular' | 'provocativo' | 'tecnico' | 'esperancoso'
export type AiProvider = 'openai' | 'anthropic' | 'gemini' | 'none'
export type GenerationType =
  | 'roteiro_30s'
  | 'roteiro_45s'
  | 'roteiro_60s'
  | 'legenda_instagram'
  | 'texto_institucional'
  | 'release'
  | 'discurso_curto'
  | 'frases_impacto'
  | 'ideias_carrossel'

export interface Category {
  id: string
  user_id: string
  name: string
  color?: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface Idea {
  id: string
  user_id: string
  title: string
  description: string
  category_id?: string
  category?: Category
  urgency: UrgencyLevel
  status: IdeaStatus
  tags?: Tag[]
  created_at: string
  updated_at: string
}

export interface Brainstorm {
  id: string
  user_id: string
  idea_id?: string
  central_idea: string
  problem_solved: string
  target_audience: string
  emotion: string
  impact_phrase: string
  main_arguments: string
  local_examples: string
  tone: ContentTone
  format: TextFormat
  free_notes: string
  created_at: string
  updated_at: string
}

export interface Text {
  id: string
  user_id: string
  idea_id?: string
  brainstorm_id?: string
  title: string
  content: string
  category_id?: string
  category?: Category
  status: TextStatus
  format: TextFormat
  scheduled_date?: string
  published_link?: string
  notes?: string
  tags?: Tag[]
  word_count: number
  created_at: string
  updated_at: string
}

export interface AiGeneration {
  id: string
  user_id: string
  brainstorm_id?: string
  text_id?: string
  type: GenerationType
  prompt_used: string
  result: string
  provider: AiProvider
  created_at: string
}

export interface DashboardStats {
  totalIdeas: number
  textsInProgress: number
  textsReady: number
  topCategories: { name: string; count: number }[]
  recentIdeas: Idea[]
}

export interface AppSettings {
  aiProvider: AiProvider
  preCampaignMode: boolean
  theme: 'dark' | 'light'
}

export interface VoiceSettings {
  user_id: string
  candidate_name: string
  slogans: string[]
  bordoes: string[]
  keywords: string[]
  pautas: string[]
  cta: string
  signoff: string
  avoid: string
  region_focus: string
  created_at: string
  updated_at: string
}
