import { useState, useEffect, useRef, useCallback } from 'react'
import { databaseService } from '@/services/supabase/database'
import { chatApi } from '@/services/chat/chatApi'
import { Message } from '@/types/chat'

interface UseChatProps {
  conversationId?: string
  onCreateConversation?: (firstMessage: string) => Promise<{ id: string } | null>
}

export function useChat({ conversationId, onCreateConversation }: UseChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  // Load messages when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setStreamingMessage('')
      setIsGenerating(false)
      setError(null)
      return
    }

    let isMounted = true
    databaseService.getMessages(conversationId).then((data) => {
      if (isMounted) {
        setMessages(data)
        setStreamingMessage('')
        setIsGenerating(false)
        setError(null)
      }
    })

    return () => {
      isMounted = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [conversationId])

  // Stop Generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsGenerating(false)

    if (streamingMessage && conversationId) {
      const partialId = crypto.randomUUID()
      const partialMsg: Message = {
        id: partialId,
        conversation_id: conversationId,
        role: 'assistant',
        content: streamingMessage,
        status: 'interrupted',
        model: 'gemini-2.5-flash',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, partialMsg])
      databaseService.createMessage(partialMsg)
      setStreamingMessage('')
    }
  }, [streamingMessage, conversationId])

  // Send Message
  const sendMessage = async (overrideContent?: string) => {
    const textToSend = (overrideContent ?? input).trim()
    if (!textToSend || isGenerating) return

    setError(null)
    setInput('')

    let targetConvId = conversationId

    // 1. If no active conversation, create one automatically
    if (!targetConvId && onCreateConversation) {
      const newConv = await onCreateConversation(textToSend)
      if (!newConv) {
        setError('Failed to create conversation.')
        return
      }
      targetConvId = newConv.id
    }

    if (!targetConvId) return

    // 2. Optimistic user message
    const userMsgId = crypto.randomUUID()
    const userMsg: Message = {
      id: userMsgId,
      conversation_id: targetConvId,
      role: 'user',
      content: textToSend,
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    await databaseService.createMessage(userMsg)

    // 3. Initiate Streaming from backend
    setIsGenerating(true)
    setStreamingMessage('')
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    await chatApi.streamChat({
      conversationId: targetConvId,
      messageContent: textToSend,
      messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
      signal: abortController.signal,
      onChunk: (chunk) => {
        setStreamingMessage((prev) => prev + chunk)
      },
      onDone: (messageId, fullText) => {
        setIsGenerating(false)
        setStreamingMessage('')
        abortControllerRef.current = null

        const assistantMsg: Message = {
          id: messageId,
          conversation_id: targetConvId,
          role: 'assistant',
          content: fullText,
          status: 'completed',
          model: 'gemini-2.5-flash',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, assistantMsg])
        databaseService.createMessage(assistantMsg)
      },
      onInterrupted: (messageId, partialText) => {
        setIsGenerating(false)
        setStreamingMessage('')
        abortControllerRef.current = null

        const partialMsg: Message = {
          id: messageId,
          conversation_id: targetConvId,
          role: 'assistant',
          content: partialText,
          status: 'interrupted',
          model: 'gemini-2.5-flash',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, partialMsg])
        databaseService.createMessage(partialMsg)
      },
      onError: (errText) => {
        setIsGenerating(false)
        setStreamingMessage('')
        abortControllerRef.current = null
        setError(errText)
      },
    })
  }

  // Regenerate Response
  const regenerateResponse = async () => {
    if (!conversationId || isGenerating || messages.length === 0) return

    setError(null)
    setIsGenerating(true)
    setStreamingMessage('')

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Preceding context up to user prompt
    const context = [...messages]
    const lastMsg = context[context.length - 1]
    const isLastAssistant = lastMsg?.role === 'assistant'
    const workingContext = isLastAssistant ? context.slice(0, -1) : context

    await chatApi.regenerateChat({
      conversationId,
      messages: workingContext.map((m) => ({ role: m.role, content: m.content })),
      signal: abortController.signal,
      onChunk: (chunk) => {
        setStreamingMessage((prev) => prev + chunk)
      },
      onDone: (messageId, fullText) => {
        setIsGenerating(false)
        setStreamingMessage('')
        abortControllerRef.current = null

        const newAssistantMsg: Message = {
          id: messageId,
          conversation_id: conversationId,
          role: 'assistant',
          content: fullText,
          status: 'completed',
          model: 'gemini-2.5-flash',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        if (isLastAssistant) {
          // Replace previous assistant message
          setMessages([...workingContext, newAssistantMsg])
        } else {
          setMessages([...context, newAssistantMsg])
        }

        databaseService.createMessage(newAssistantMsg)
      },
      onInterrupted: (messageId, partialText) => {
        setIsGenerating(false)
        setStreamingMessage('')
        abortControllerRef.current = null

        const partialMsg: Message = {
          id: messageId,
          conversation_id: conversationId,
          role: 'assistant',
          content: partialText,
          status: 'interrupted',
          model: 'gemini-2.5-flash',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, partialMsg])
        databaseService.createMessage(partialMsg)
      },
      onError: (errText) => {
        setIsGenerating(false)
        setStreamingMessage('')
        abortControllerRef.current = null
        setError(errText)
      },
    })
  }

  // Edit and Resend
  const editAndResend = async (messageId: string, newContent: string) => {
    if (!conversationId || isGenerating) return

    const index = messages.findIndex((m) => m.id === messageId)
    if (index === -1) return

    const targetMsg = messages[index]
    if (targetMsg.role !== 'user') return

    // 1. Truncate downstream messages from database
    await databaseService.deleteMessagesAfter(conversationId, targetMsg.created_at)

    // 2. Update target message
    await databaseService.updateMessage(messageId, { content: newContent })

    // 3. Update local state up to edited message
    const updatedUserMsg: Message = { ...targetMsg, content: newContent }
    const truncated = [...messages.slice(0, index), updatedUserMsg]
    setMessages(truncated)

    // 4. Request new Gemini response for the updated context
    setIsGenerating(true)
    setStreamingMessage('')

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    await chatApi.streamChat({
      conversationId,
      messageContent: newContent,
      messages: truncated.map((m) => ({ role: m.role, content: m.content })),
      signal: abortController.signal,
      onChunk: (chunk) => {
        setStreamingMessage((prev) => prev + chunk)
      },
      onDone: (newMsgId, fullText) => {
        setIsGenerating(false)
        setStreamingMessage('')
        abortControllerRef.current = null

        const assistantMsg: Message = {
          id: newMsgId,
          conversation_id: conversationId,
          role: 'assistant',
          content: fullText,
          status: 'completed',
          model: 'gemini-2.5-flash',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        setMessages([...truncated, assistantMsg])
        databaseService.createMessage(assistantMsg)
      },
      onInterrupted: (newMsgId, partialText) => {
        setIsGenerating(false)
        setStreamingMessage('')
        abortControllerRef.current = null

        const partialMsg: Message = {
          id: newMsgId,
          conversation_id: conversationId,
          role: 'assistant',
          content: partialText,
          status: 'interrupted',
          model: 'gemini-2.5-flash',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        setMessages([...truncated, partialMsg])
        databaseService.createMessage(partialMsg)
      },
      onError: (errText) => {
        setIsGenerating(false)
        setStreamingMessage('')
        abortControllerRef.current = null
        setError(errText)
      },
    })
  }

  return {
    messages,
    input,
    setInput,
    sendMessage,
    stopGeneration,
    regenerateResponse,
    editAndResend,
    isGenerating,
    streamingMessage,
    error,
  }
}
