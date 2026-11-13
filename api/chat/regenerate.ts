import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import {
  getGeminiClient,
  formatGeminiContents,
  generateStreamWithFallback,
  type ChatMessageInput,
} from '../_lib/gemini'
import {
  authenticateServerRequest,
  verifyConversationOwnership,
  getServerSupabase,
} from '../_lib/supabaseServer'

const RegenerateBodySchema = z.object({
  conversationId: z.string().min(1, 'conversationId is required'),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).min(1),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  const authHeader = req.headers.authorization
  const { userId, error: authError } = await authenticateServerRequest(authHeader)

  if (!userId) {
    return res.status(401).json({ error: authError || 'Unauthorized' })
  }

  const parseResult = RegenerateBodySchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid request body',
      details: parseResult.error.flatten(),
    })
  }

  const { conversationId, messages } = parseResult.data
  const token = authHeader?.replace('Bearer ', '').trim()

  const isOwner = await verifyConversationOwnership(conversationId, userId, token)
  if (!isOwner) {
    return res.status(403).json({ error: 'Forbidden: You do not own this conversation' })
  }

  // Preceding context: If the last message in the array is assistant, remove it so Gemini regenerates from the user turn
  const precedingContext = [...messages]
  if (precedingContext.length > 0 && precedingContext[precedingContext.length - 1].role === 'assistant') {
    precedingContext.pop()
  }

  if (precedingContext.length === 0) {
    return res.status(400).json({ error: 'No preceding user prompt found to regenerate.' })
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders()
  }

  let isAborted = false
  req.on('close', () => {
    isAborted = true
  })

  let fullResponse = ''
  let status: 'completed' | 'interrupted' | 'failed' = 'completed'

  try {
    const { client, model } = getGeminiClient()
    const contents = formatGeminiContents(precedingContext as ChatMessageInput[])

    const { responseStream, usedModel } = await generateStreamWithFallback(
      client,
      model,
      contents
    )

    for await (const chunk of responseStream) {
      if (isAborted) {
        status = 'interrupted'
        break
      }

      const chunkText = chunk.text || ''
      if (chunkText) {
        fullResponse += chunkText
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunkText })}\n\n`)
      }
    }

    const assistantMessageId = crypto.randomUUID()
    res.write(
      `data: ${JSON.stringify({
        type: isAborted ? 'interrupted' : 'done',
        messageId: assistantMessageId,
        text: fullResponse,
      })}\n\n`
    )

    const supabase = getServerSupabase(token)
    if (supabase && fullResponse.trim()) {
      await supabase.from('messages').insert({
        id: assistantMessageId,
        conversation_id: conversationId,
        role: 'assistant',
        content: fullResponse,
        status,
        model: usedModel,
      })

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
    }

    res.end()
  } catch (err: unknown) {
    console.error('Error during regeneration:', err)
    const errorMessage =
      err instanceof Error ? err.message : 'An error occurred during regeneration.'

    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        error: errorMessage,
      })}\n\n`
    )
    res.end()
  }
}
