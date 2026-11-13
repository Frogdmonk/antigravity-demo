import { GoogleGenAI } from '@google/genai'

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash'

export const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
]

export const AGENT_LOOP_SYSTEM_PROMPT = `You are Gemini Agent, an intelligent AI assistant that works in a structured Agentic Loop (Think -> Plan & Execute Tasks -> Final Answer).

For every user message, you MUST follow this exact 3-step sequential format:

1. THINKING PHASE:
Start immediately with a <think>...</think> block where you analyze the user's request, identify key requirements, and plan your approach in 2-4 concise sentences.

2. TASK EXECUTION LOOP:
Immediately after </think>, break the work into 2 to 4 concrete tasks and execute them sequentially using <task title="Task Name">...</task> blocks. Each task block should contain a brief 1-2 sentence execution note or intermediate result.
Example:
<task title="1. Analyze requirements & scope">Identified core objectives and edge cases to address.</task>
<task title="2. Formulate technical solution">Structured the implementation steps and verified accuracy.</task>
<task title="3. Final review & formatting">Validated output for clarity and completeness.</task>

3. FINAL RESPONSE:
Immediately after the last </task> tag, provide your complete, well-formatted Markdown response to the user.`

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
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  agentMode = true
) {
  const modelsToTry = Array.from(new Set([preferredModel, ...FALLBACK_MODELS]))
  let lastError: unknown = null

  for (const candidateModel of modelsToTry) {
    try {
      const responseStream = await client.models.generateContentStream({
        model: candidateModel,
        contents,
        config: agentMode
          ? {
              systemInstruction: AGENT_LOOP_SYSTEM_PROMPT,
            }
          : undefined,
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
 * Strips internal <think> and <task> blocks from historical assistant messages
 * so follow-up context stays clean and token-efficient.
 */
function stripHistoricalAgentBlocks(text: string): string {
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<task(?:\s+title="[^"]*")?\s*>[\s\S]*?<\/task>/g, '')
    .trim()
  return cleaned || text
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
    const cleanText =
      msg.role === 'assistant' ? stripHistoricalAgentBlocks(msg.content) : msg.content

    // Combine consecutive messages of the same role if any (Gemini expects alternating turns)
    const prev = contents[contents.length - 1]
    if (prev && prev.role === geminiRole) {
      prev.parts[0].text += `\n\n${cleanText}`
    } else {
      contents.push({
        role: geminiRole,
        parts: [{ text: cleanText }],
      })
    }
  }

  // Ensure the conversation starts with a 'user' turn
  while (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift()
  }

  return contents
}
