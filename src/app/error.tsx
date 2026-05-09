'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 bg-background text-foreground">
      <div className="text-center space-y-3 max-w-lg">
        <h2 className="text-xl font-bold text-destructive">Erro na página</h2>
        <p className="text-sm text-muted-foreground font-mono bg-muted rounded-lg p-3 text-left break-words">
          {error.message || 'Erro desconhecido'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">Digest: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  )
}
