import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { GoogleGenAI } from '@google/genai'

const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
]

const AGENT_LOOP_SYSTEM_PROMPT = `You are Gemini Agent, an intelligent AI assistant that works in a structured Agentic Loop (Think -> Plan & Execute Tasks -> Final Answer).

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

function localApiPlugin(): Plugin {
  return {
    name: 'local-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next()
        }

        const env = loadEnv(server.config.mode, process.cwd(), '')
        const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
        const rawModel = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash'
        const preferredModel =
          rawModel === 'gemini-2.5-flash' ? 'gemini-3.5-flash' : rawModel

        // 1. POST /api/chat or POST /api/chat/regenerate
        if (
          (req.url === '/api/chat' || req.url === '/api/chat/regenerate') &&
          req.method === 'POST'
        ) {
          let bodyStr = ''
          req.on('data', (chunk) => {
            bodyStr += chunk
          })

          req.on('end', async () => {
            res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
            res.setHeader('Cache-Control', 'no-cache, no-transform')
            res.setHeader('Connection', 'keep-alive')
            res.setHeader('X-Accel-Buffering', 'no')

            let body: Record<string, unknown> & {
              agentMode?: boolean
              messages?: Array<{ role: 'user' | 'assistant'; content: string }>
            } = {}
            try {
              body = JSON.parse(bodyStr)
            } catch {
              res.write(
                `data: ${JSON.stringify({ type: 'error', error: 'Malformed JSON payload' })}\n\n`
              )
              return res.end()
            }

            const messages: Array<{ role: 'user' | 'assistant'; content: string }> =
              body.messages || []
            const agentMode = body.agentMode !== false

            if (!apiKey || apiKey === 'your-gemini-api-key') {
              const notice =
                '⚠️ **Gemini API Key Required**\n\nTo receive live responses from Google Gemini, please add your `GEMINI_API_KEY` to the `.env` file in the project root.\n\nGet your free key at [Google AI Studio](https://aistudio.google.com/).'
              res.write(`data: ${JSON.stringify({ type: 'chunk', text: notice })}\n\n`)
              res.write(
                `data: ${JSON.stringify({
                  type: 'done',
                  messageId: crypto.randomUUID(),
                  text: notice,
                })}\n\n`
              )
              return res.end()
            }

            try {
              const ai = new GoogleGenAI({ apiKey })

              // For regenerate, exclude trailing assistant response
              const context =
                req.url === '/api/chat/regenerate' &&
                messages.length > 0 &&
                messages[messages.length - 1].role === 'assistant'
                  ? messages.slice(0, -1)
                  : messages

              const contents = context.map((m) => ({
                role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
                parts: [
                  {
                    text:
                      m.role === 'assistant'
                        ? m.content
                            .replace(/<think>[\s\S]*?<\/think>/g, '')
                            .replace(/<task(?:\s+title="[^"]*")?\s*>[\s\S]*?<\/task>/g, '')
                            .trim() || m.content
                        : m.content,
                  },
                ],
              }))

              // Ensure starts with user
              while (contents.length > 0 && contents[0].role !== 'user') {
                contents.shift()
              }

              const modelsToTry = Array.from(new Set([preferredModel, ...FALLBACK_MODELS]))
              let responseStream: Awaited<ReturnType<typeof ai.models.generateContentStream>> | null = null
              let lastError: unknown = null

              for (const candidateModel of modelsToTry) {
                try {
                  responseStream = await ai.models.generateContentStream({
                    model: candidateModel,
                    contents,
                    config: agentMode
                      ? {
                          systemInstruction: AGENT_LOOP_SYSTEM_PROMPT,
                        }
                      : undefined,
                  })
                  break
                } catch (err: unknown) {
                  lastError = err
                  const msg = err instanceof Error ? err.message : String(err)
                  const isRetryable =
                    msg.includes('404') ||
                    msg.includes('NOT_FOUND') ||
                    msg.includes('503') ||
                    msg.includes('UNAVAILABLE') ||
                    msg.includes('no longer available') ||
                    msg.includes('high demand')
                  if (!isRetryable) throw err
                }
              }

              if (!responseStream) {
                throw lastError || new Error('All Gemini models are currently unavailable.')
              }

              let fullText = ''
              for await (const chunk of responseStream) {
                const text = chunk.text || ''
                if (text) {
                  fullText += text
                  res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`)
                }
              }

              res.write(
                `data: ${JSON.stringify({
                  type: 'done',
                  messageId: crypto.randomUUID(),
                  text: fullText,
                })}\n\n`
              )
              res.end()
            } catch (err: unknown) {
              const errorText =
                err instanceof Error ? err.message : 'Unknown generation error'
              res.write(
                `data: ${JSON.stringify({ type: 'error', error: errorText })}\n\n`
              )
              res.end()
            }
          })
          return
        }

        // Other API endpoints return 200 for local dev
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ success: true }))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react'
            }
            if (id.includes('highlight.js') || id.includes('react-markdown') || id.includes('remark-gfm')) {
              return 'vendor-markdown'
            }
            if (id.includes('@google/genai') || id.includes('@supabase')) {
              return 'vendor-ai'
            }
          }
        },
      },
    },
  },
})
