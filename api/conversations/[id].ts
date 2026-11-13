import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import {
  authenticateServerRequest,
  verifyConversationOwnership,
  getServerSupabase,
} from '../_lib/supabaseServer'

const UpdateTitleSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(100),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query
  const conversationId = Array.isArray(id) ? id[0] : id

  if (!conversationId) {
    return res.status(400).json({ error: 'Conversation ID is required' })
  }

  const authHeader = req.headers.authorization
  const { userId, error: authError } = await authenticateServerRequest(authHeader)

  if (!userId) {
    return res.status(401).json({ error: authError || 'Unauthorized' })
  }

  const token = authHeader?.replace('Bearer ', '').trim()
  const isOwner = await verifyConversationOwnership(conversationId, userId, token)
  if (!isOwner) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const supabase = getServerSupabase(token)

  if (req.method === 'PATCH') {
    const parse = UpdateTitleSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() })
    }

    if (supabase) {
      const { error } = await supabase
        .from('conversations')
        .update({ title: parse.data.title, updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      if (error) {
        return res.status(500).json({ error: error.message })
      }
    }

    return res.status(200).json({ success: true, title: parse.data.title })
  }

  if (req.method === 'DELETE') {
    if (supabase) {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (error) {
        return res.status(500).json({ error: error.message })
      }
    }

    return res.status(200).json({ success: true, message: 'Conversation deleted' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

