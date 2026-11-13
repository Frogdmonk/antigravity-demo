import { useState, useEffect, useCallback } from 'react'
import { databaseService } from '@/services/supabase/database'
import { Conversation } from '@/types/conversation'
import { generateConversationTitle } from '@/utils/formatting'
import { useAuth } from '@/hooks/useAuth'

export function useConversations() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  const loadConversations = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await databaseService.getConversations(user?.id)
      setConversations(data)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const createConversation = async (firstMessage: string): Promise<Conversation | null> => {
    const title = generateConversationTitle(firstMessage)
    const userId = user?.id || 'anonymous'
    const newConv = await databaseService.createConversation(userId, title)
    if (newConv) {
      setConversations((prev) => [newConv, ...prev])
      setActiveConversationId(newConv.id)
    }
    return newConv
  }

  const renameConversation = async (id: string, newTitle: string) => {
    // Optimistic update
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    )
    await databaseService.updateConversationTitle(id, newTitle)
  }

  const deleteConversation = async (id: string) => {
    // Optimistic update
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeConversationId === id) {
      setActiveConversationId(undefined)
    }
    await databaseService.deleteConversation(id)
  }

  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  return {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    loadConversations,
    createConversation,
    renameConversation,
    deleteConversation,
    isLoading,
  }
}

