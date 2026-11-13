import { supabase } from '@/services/supabase/client'

interface StreamChatOptions {
  conversationId: string
  messageContent: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  signal?: AbortSignal
  onChunk: (text: string) => void
  onDone: (messageId: string, fullText: string) => void
  onInterrupted: (messageId: string, partialText: string) => void
  onError: (error: string) => void
}

export const chatApi = {
  async streamChat({
    conversationId,
    messageContent,
    messages,
    signal,
    onChunk,
    onDone,
    onInterrupted,
    onError,
  }: StreamChatOptions): Promise<void> {
    try {
      // Get authenticated user token
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversationId,
          messageContent,
          messages,
        }),
        signal,
      })

      if (!response.ok) {
        let errMessage = `Server error (${response.status})`
        try {
          const json = await response.json()
          if (json.error) errMessage = typeof json.error === 'string' ? json.error : JSON.stringify(json.error)
        } catch {
          // Response was not JSON
        }
        onError(errMessage)
        return
      }

      if (!response.body) {
        onError('ReadableStream not supported by browser response.')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let fullText = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data: ')) {
            const rawData = trimmed.slice(6)
            try {
              const event = JSON.parse(rawData)
              if (event.type === 'chunk' && event.text) {
                fullText += event.text
                onChunk(event.text)
              } else if (event.type === 'done') {
                onDone(event.messageId || crypto.randomUUID(), fullText)
              } else if (event.type === 'interrupted') {
                onInterrupted(event.messageId || crypto.randomUUID(), fullText)
              } else if (event.type === 'error') {
                onError(event.error || 'AI generation failed.')
              }
            } catch {
              // Ignore malformed SSE line
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Handled cleanly via abort signal
        return
      }
      onError(err instanceof Error ? err.message : 'Network error during stream.')
    }
  },

  async regenerateChat({
    conversationId,
    messages,
    signal,
    onChunk,
    onDone,
    onInterrupted,
    onError,
  }: Omit<StreamChatOptions, 'messageContent'>): Promise<void> {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/chat/regenerate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversationId,
          messages,
        }),
        signal,
      })

      if (!response.ok) {
        let errMessage = `Server error (${response.status})`
        try {
          const json = await response.json()
          if (json.error) errMessage = typeof json.error === 'string' ? json.error : JSON.stringify(json.error)
        } catch {
          // Non-JSON
        }
        onError(errMessage)
        return
      }

      if (!response.body) {
        onError('ReadableStream not supported by browser response.')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let fullText = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data: ')) {
            const rawData = trimmed.slice(6)
            try {
              const event = JSON.parse(rawData)
              if (event.type === 'chunk' && event.text) {
                fullText += event.text
                onChunk(event.text)
              } else if (event.type === 'done') {
                onDone(event.messageId || crypto.randomUUID(), fullText)
              } else if (event.type === 'interrupted') {
                onInterrupted(event.messageId || crypto.randomUUID(), fullText)
              } else if (event.type === 'error') {
                onError(event.error || 'AI regeneration failed.')
              }
            } catch {
              // Ignore malformed SSE line
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      onError(err instanceof Error ? err.message : 'Network error during regeneration.')
    }
  },
}
