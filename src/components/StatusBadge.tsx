import { Badge } from '@/components/ui/badge'
import type { IdeaStatus, TextStatus } from '@/types'

const IDEA_STATUS_CONFIG: Record<IdeaStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'outline' | 'destructive' }> = {
  bruta: { label: 'Ideia Bruta', variant: 'secondary' },
  em_desenvolvimento: { label: 'Em Desenvolvimento', variant: 'info' },
  transformada: { label: 'Transformada', variant: 'success' },
  arquivada: { label: 'Arquivada', variant: 'outline' },
}

const TEXT_STATUS_CONFIG: Record<TextStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'outline' | 'destructive' }> = {
  rascunho: { label: 'Rascunho', variant: 'secondary' },
  revisar: { label: 'Revisar', variant: 'warning' },
  pronto: { label: 'Pronto para Gravar', variant: 'info' },
  gravado: { label: 'Gravado', variant: 'success' },
  publicado: { label: 'Publicado', variant: 'default' },
  arquivado: { label: 'Arquivado', variant: 'outline' },
}

interface IdeaStatusBadgeProps {
  status: IdeaStatus
  className?: string
}

export function IdeaStatusBadge({ status, className }: IdeaStatusBadgeProps) {
  const config = IDEA_STATUS_CONFIG[status]
  return <Badge variant={config.variant} className={className}>{config.label}</Badge>
}

interface TextStatusBadgeProps {
  status: TextStatus
  className?: string
}

export function TextStatusBadge({ status, className }: TextStatusBadgeProps) {
  const config = TEXT_STATUS_CONFIG[status]
  return <Badge variant={config.variant} className={className}>{config.label}</Badge>
}
