import { createClient } from '@/lib/supabase/client'
import { buildVoiceContext } from '@/lib/voiceContext'
import type { VoiceSettings } from '@/types'

/**
 * Fetches the current user's voice_settings and returns the
 * formatted context string to send to AI generation routes.
 * Returns '' if no settings exist or user isn't logged in.
 */
export async function loadVoiceContext(): Promise<string> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ''
    const { data } = await supabase
      .from('voice_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!data) return ''
    return buildVoiceContext(data as VoiceSettings)
  } catch {
    return ''
  }
}
