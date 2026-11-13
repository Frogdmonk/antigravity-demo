import { createClient, SupabaseClient } from '@supabase/supabase-js'

export function getServerSupabase(token?: string): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

  if (!url || !key || url.includes('your-project-id')) {
    return null
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  })
}

export async function authenticateServerRequest(
  authHeader?: string
): Promise<{ userId: string | null; error?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, error: 'Missing or malformed Authorization header' }
  }

  const token = authHeader.replace('Bearer ', '').trim()
  const supabase = getServerSupabase(token)

  if (!supabase) {
    // Supabase not configured on server
    return { userId: 'development-user' }
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { userId: null, error: error?.message || 'Unauthorized user token' }
  }

  return { userId: user.id }
}

export async function verifyConversationOwnership(
  conversationId: string,
  userId: string,
  token?: string
): Promise<boolean> {
  const supabase = getServerSupabase(token)
  if (!supabase) return true // Allow local dev if Supabase is unconfigured

  const { data, error } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single()

  return !error && !!data
}

