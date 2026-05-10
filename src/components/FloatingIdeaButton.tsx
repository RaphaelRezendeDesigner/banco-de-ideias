'use client'

import { useState, useEffect } from 'react'
import { Lightbulb } from 'lucide-react'
import { IdeaQuickDialog } from './IdeaQuickDialog'
import { TransformIdeaDialog } from './TransformIdeaDialog'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Idea, Category } from '@/types'

export function FloatingIdeaButton() {
  const [open, setOpen] = useState(false)
  const [transformIdea, setTransformIdea] = useState<Idea | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('categories').select('*').order('name')
      if (data) setCategories(data)
    })()
  }, [])

  return (
    <>
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-center gap-2">
        <div className="relative">
          <div className={cn(
            'absolute inset-0 rounded-full bg-gold-500/40 animate-pulse-ring',
            !open && 'block', open && 'hidden',
          )} />
          <button
            onClick={() => setOpen(true)}
            className={cn(
              'relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300',
              'bg-gradient-to-br from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500',
              'hover:scale-110 active:scale-95',
              open && 'rotate-180 scale-90 opacity-0 pointer-events-none',
            )}
            title="Nova ideia rápida"
          >
            <Lightbulb className="w-6 h-6 text-zinc-900" />
          </button>
        </div>
      </div>

      <IdeaQuickDialog
        open={open}
        onOpenChange={setOpen}
        categories={categories}
        onCreated={(created, autoTransform) => {
          if (autoTransform) setTransformIdea(created)
        }}
      />

      <TransformIdeaDialog
        idea={transformIdea}
        onClose={() => setTransformIdea(null)}
      />
    </>
  )
}
