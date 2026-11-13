import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import {
  authenticateServerRequest,
  getServerSupabase,
} from '../_lib/supabaseServer.js'

const UpdateMessageSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed. Use PATCH.' })
  }

  const { id } = req.query
  const messageId = Array.isArray(id) ? id[0] : id

  if (!messageId) {
    return res.status(400).json({ error: 'Message ID is required' })
  }

  const authHeader = req.headers.authorization
  const { userId, error: authError } = await authenticateServerRequest(authHeader)

  if (!userId) {
    return res.status(401).json({ error: authError || 'Unauthorized' })
  }

  const parse = UpdateMessageSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() })
  }

  const token = authHeader?.replace('Bearer ', '').trim()
  const supabase = getServerSupabase(token)

  if (supabase) {
    // 1. Fetch message and verify ownership through parent conversation
    const { data: message, error: fetchErr } = await supabase
      .from('messages')
      .select('id, conversation_id, created_at')
      .eq('id', messageId)
      .single()

    if (fetchErr || !message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Check conversation ownership
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', message.conversation_id)
      .eq('user_id', userId)
      .single()

    if (convErr || !conv) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Update message content
    const { error: updateErr } = await supabase
      .from('messages')
      .update({
        content: parse.data.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message })
    }

    // Delete downstream messages created after this message
    await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', message.conversation_id)
      .gt('created_at', message.created_at)
  }

  return res.status(200).json({ success: true, message: 'Message updated and downstream truncated' })
}

