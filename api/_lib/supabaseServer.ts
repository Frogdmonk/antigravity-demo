import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function getServerSupabase(token?: string): SupabaseClient | null {
  try {
    const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim()
    const rawKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim()
    // Fix common copy-paste typo (ssb_publishable_ -> sb_publishable_)
    const key = rawKey.startsWith('ssb_publishable_') ? rawKey.slice(1) : rawKey

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
  } catch (err) {
    console.error('Failed to initialize server Supabase client:', err)
    return null
  }
}

export async function authenticateServerRequest(
  authHeader?: string
): Promise<{ userId: string | null; error?: string }> {
  try {
    const supabase = getServerSupabase()
    if (!supabase) {
      // Supabase not configured on server -> allow request in standalone mode
      return { userId: 'development-user' }
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { userId: 'anonymous-user' }
    }

    const token = authHeader.replace('Bearer ', '').trim()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return { userId: null, error: error?.message || 'Unauthorized user token' }
    }

    return { userId: user.id }
  } catch (err) {
    console.error('Auth verification error:', err)
    return { userId: 'development-user' }
  }
}

export async function verifyConversationOwnership(
  conversationId: string,
  userId: string,
  token?: string
): Promise<boolean> {
  try {
    const supabase = getServerSupabase(token)
    if (!supabase || userId === 'development-user' || userId === 'anonymous-user') {
      return true
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversationId)
      .maybeSingle()

    if (error) {
      // If table is not yet migrated or RLS blocks anonymous check, allow request to proceed
      return true
    }

    // If conversation exists in DB, verify it belongs to the requesting user
    if (data && data.user_id && data.user_id !== userId) {
      return false
    }

    return true
  } catch {
    return true
  }
}
