import { GoogleGenAI } from '@google/genai'

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash'

export const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
]

export function getGeminiClient(): { client: GoogleGenAI; model: string } {
  const apiKey = process.env.GEMINI_API_KEY || ''
  const rawModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL
  // Automatically upgrade deprecated gemini-2.5-flash if still in env
  const model = rawModel === 'gemini-2.5-flash' ? DEFAULT_GEMINI_MODEL : rawModel

  if (!apiKey || apiKey === 'your-gemini-api-key') {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your environment variables.'
    )
  }

  const client = new GoogleGenAI({ apiKey })
  return { client, model }
}

/**
 * Attempts to open a streaming response with the preferred model,
 * and falls back automatically if the model returns 404 (not found/deprecated)
 * or 503 (temporary high demand spike).
 */
export async function generateStreamWithFallback(
  client: GoogleGenAI,
  preferredModel: string,
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>
) {
  const modelsToTry = Array.from(new Set([preferredModel, ...FALLBACK_MODELS]))
  let lastError: unknown = null

  for (const candidateModel of modelsToTry) {
    try {
      const responseStream = await client.models.generateContentStream({
        model: candidateModel,
        contents,
      })
      return { responseStream, usedModel: candidateModel }
    } catch (err: unknown) {
      lastError = err
      const msg = err instanceof Error ? err.message : String(err)
      const isRetryableModelError =
        msg.includes('404') ||
        msg.includes('NOT_FOUND') ||
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('no longer available') ||
        msg.includes('high demand')

      if (!isRetryableModelError) {
        throw err
      }
      console.warn(`Model ${candidateModel} unavailable (${msg.slice(0, 80)}), trying next fallback...`)
    }
  }

  throw lastError || new Error('All Gemini models are currently unavailable.')
}

export interface ChatMessageInput {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Transforms application messages to the official Gemini contents structure.
 * Respects max context window by taking the most recent messages.
 */
export function formatGeminiContents(
  messages: ChatMessageInput[],
  maxMessages = 16
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  // Take the most recent messages up to maxMessages
  const trimmed = messages.slice(-maxMessages)

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []

  for (const msg of trimmed) {
    if (!msg.content || !msg.content.trim()) continue
    const geminiRole = msg.role === 'assistant' ? 'model' : 'user'

    // Combine consecutive messages of the same role if any (Gemini expects alternating turns)
    const prev = contents[contents.length - 1]
    if (prev && prev.role === geminiRole) {
      prev.parts[0].text += `\n\n${msg.content}`
    } else {
      contents.push({
        role: geminiRole,
        parts: [{ text: msg.content }],
      })
    }
  }

  // Ensure the conversation starts with a 'user' turn
  while (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift()
  }

  return contents
}
