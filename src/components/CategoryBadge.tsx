import { cn } from '@/lib/utils'
import type { Category } from '@/types'

interface CategoryBadgeProps {
  category?: Category
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  if (!category) return null
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', className)}
      style={{
        backgroundColor: `${category.color}20`,
        color: category.color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </span>
  )
}
