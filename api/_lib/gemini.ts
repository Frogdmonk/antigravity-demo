import { GoogleGenAI } from '@google/genai'

export function getGeminiClient(): { client: GoogleGenAI; model: string } {
  const apiKey = process.env.GEMINI_API_KEY || ''
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  if (!apiKey || apiKey === 'your-gemini-api-key') {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your environment variables.'
    )
  }

  const client = new GoogleGenAI({ apiKey })
  return { client, model }
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
