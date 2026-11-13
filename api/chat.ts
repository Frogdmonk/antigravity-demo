import crypto from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import {
  getGeminiClient,
  formatGeminiContents,
  generateStreamWithFallback,
  type ChatMessageInput,
} from './_lib/gemini.js'
import {
  authenticateServerRequest,
  verifyConversationOwnership,
  getServerSupabase,
} from './_lib/supabaseServer.js'

const ChatBodySchema = z.object({
  conversationId: z.string().min(1, 'conversationId is required'),
  messageContent: z.string().min(1, 'messageContent cannot be empty'),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .min(1),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  let headersSent = false

  try {
    // 1. Authenticate user
    const authHeader = req.headers.authorization
    const { userId, error: authError } = await authenticateServerRequest(authHeader)

    if (!userId) {
      return res.status(401).json({ error: authError || 'Unauthorized' })
    }

    // 2. Parse and validate request body
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const parseResult = ChatBodySchema.safeParse(rawBody)
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: parseResult.error.flatten(),
      })
    }

    const { conversationId, messages } = parseResult.data
    const token = authHeader?.replace('Bearer ', '').trim()

    // 3. Verify conversation ownership
    const isOwner = await verifyConversationOwnership(conversationId, userId, token)
    if (!isOwner) {
      return res.status(403).json({ error: 'Forbidden: You do not own this conversation' })
    }

    // 4. Configure SSE Streaming headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders()
    }
    headersSent = true

    let isAborted = false
    req.on('close', () => {
      isAborted = true
    })

    let fullResponse = ''
    let status: 'completed' | 'interrupted' | 'failed' = 'completed'

    const { client, model } = getGeminiClient()
    const contents = formatGeminiContents(messages as ChatMessageInput[])

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

    // Send final completion event
    const assistantMessageId = crypto.randomUUID()
    res.write(
      `data: ${JSON.stringify({
        type: isAborted ? 'interrupted' : 'done',
        messageId: assistantMessageId,
        text: fullResponse,
      })}\n\n`
    )

    // 5. Persist assistant message in Supabase (non-blocking error handling)
    try {
      const supabase = getServerSupabase(token)
      if (supabase && fullResponse.trim() && userId !== 'development-user' && userId !== 'anonymous-user') {
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
    } catch (dbErr) {
      console.warn('Database persistence warning:', dbErr)
    }

    res.end()
  } catch (err: unknown) {
    console.error('Error during Gemini generation:', err)
    const errorMessage =
      err instanceof Error ? err.message : 'An error occurred during AI response generation.'

    if (!headersSent && !res.headersSent) {
      return res.status(500).json({ error: errorMessage })
    }

    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        error: errorMessage,
      })}\n\n`
    )
    res.end()
  }
}
