export type MessageRole = 'user' | 'assistant'

export type MessageStatus = 'pending' | 'completed' | 'interrupted' | 'failed'

export interface Message {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  status: MessageStatus
  model?: string | null
  created_at: string
  updated_at: string
}

export interface StreamEventPayload {
  type: 'chunk' | 'done' | 'error' | 'interrupted'
  text?: string
  messageId?: string
  error?: string
}

export interface SendMessageOptions {
  conversationId?: string
  content: string
  parentMessageId?: string
}

