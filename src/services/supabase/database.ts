import { supabase, isSupabaseConfigured } from './client'
import { Conversation } from '@/types/conversation'
import { Message } from '@/types/chat'

// Fallback in-memory / local storage keys when Supabase is not configured
const LOCAL_CONVERSATIONS_KEY = 'gemini_chat_local_conversations'
const LOCAL_MESSAGES_KEY = 'gemini_chat_local_messages'

function getLocalConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(LOCAL_CONVERSATIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalConversations(conversations: Conversation[]) {
  try {
    localStorage.setItem(LOCAL_CONVERSATIONS_KEY, JSON.stringify(conversations))
  } catch {
    // Ignore
  }
}

function getLocalMessages(): Message[] {
  try {
    const raw = localStorage.getItem(LOCAL_MESSAGES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalMessages(messages: Message[]) {
  try {
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(messages))
  } catch {
    // Ignore
  }
}

export const databaseService = {
  // --------------------------------------------------------------------------
  // Conversations
  // --------------------------------------------------------------------------
  async getConversations(userId?: string): Promise<Conversation[]> {
    if (!isSupabaseConfigured || !userId) {
      return getLocalConversations()
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return getLocalConversations()
    }

    return (data as Conversation[]) || []
  },

  async createConversation(userId: string, title: string): Promise<Conversation | null> {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (!isSupabaseConfigured) {
      const current = getLocalConversations()
      saveLocalConversations([newConv, ...current])
      return newConv
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        id: newConv.id,
        user_id: userId,
        title,
        created_at: newConv.created_at,
        updated_at: newConv.updated_at,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation in Supabase:', error)
      // fallback to local
      const current = getLocalConversations()
      saveLocalConversations([newConv, ...current])
      return newConv
    }

    return data as Conversation
  },

  async updateConversationTitle(id: string, title: string): Promise<boolean> {
    const now = new Date().toISOString()

    if (!isSupabaseConfigured) {
      const current = getLocalConversations()
      saveLocalConversations(
        current.map((c) => (c.id === id ? { ...c, title, updated_at: now } : c))
      )
      return true
    }

    const { error } = await supabase
      .from('conversations')
      .update({ title, updated_at: now })
      .eq('id', id)

    if (error) {
      console.error('Error updating conversation title:', error)
      return false
    }

    return true
  },

  async deleteConversation(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      const current = getLocalConversations()
      saveLocalConversations(current.filter((c) => c.id !== id))
      const msgs = getLocalMessages()
      saveLocalMessages(msgs.filter((m) => m.conversation_id !== id))
      return true
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting conversation:', error)
      return false
    }

    return true
  },

  // --------------------------------------------------------------------------
  // Messages
  // --------------------------------------------------------------------------
  async getMessages(conversationId: string): Promise<Message[]> {
    if (!isSupabaseConfigured) {
      const msgs = getLocalMessages()
      return msgs
        .filter((m) => m.conversation_id === conversationId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages from Supabase:', error)
      const msgs = getLocalMessages()
      return msgs.filter((m) => m.conversation_id === conversationId)
    }

    return (data as Message[]) || []
  },

  async createMessage(message: Omit<Message, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Message | null> {
    const now = new Date().toISOString()
    const newMsg: Message = {
      id: message.id || crypto.randomUUID(),
      conversation_id: message.conversation_id,
      role: message.role,
      content: message.content,
      status: message.status || 'completed',
      model: message.model ?? null,
      created_at: now,
      updated_at: now,
    }

    if (!isSupabaseConfigured) {
      const msgs = getLocalMessages()
      saveLocalMessages([...msgs, newMsg])
      // also update conversation updated_at
      const convs = getLocalConversations()
      saveLocalConversations(
        convs.map((c) => (c.id === message.conversation_id ? { ...c, updated_at: now } : c))
      )
      return newMsg
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        id: newMsg.id,
        conversation_id: newMsg.conversation_id,
        role: newMsg.role,
        content: newMsg.content,
        status: newMsg.status,
        model: newMsg.model,
        created_at: newMsg.created_at,
        updated_at: newMsg.updated_at,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating message in Supabase:', error)
      const msgs = getLocalMessages()
      saveLocalMessages([...msgs, newMsg])
      return newMsg
    }

    // Touch parent conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: now })
      .eq('id', message.conversation_id)

    return data as Message
  },

  async updateMessage(id: string, updates: Partial<Message>): Promise<boolean> {
    const now = new Date().toISOString()

    if (!isSupabaseConfigured) {
      const msgs = getLocalMessages()
      saveLocalMessages(
        msgs.map((m) => (m.id === id ? { ...m, ...updates, updated_at: now } : m))
      )
      return true
    }

    const { error } = await supabase
      .from('messages')
      .update({ ...updates, updated_at: now })
      .eq('id', id)

    if (error) {
      console.error('Error updating message:', error)
      return false
    }

    return true
  },

  async deleteMessagesAfter(conversationId: string, createdAt: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      const msgs = getLocalMessages()
      const threshold = new Date(createdAt).getTime()
      saveLocalMessages(
        msgs.filter(
          (m) => !(m.conversation_id === conversationId && new Date(m.created_at).getTime() >= threshold)
        )
      )
      return true
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId)
      .gte('created_at', createdAt)

    if (error) {
      console.error('Error deleting downstream messages:', error)
      return false
    }

    return true
  },
}

