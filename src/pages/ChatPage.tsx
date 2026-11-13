import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useConversations } from '@/hooks/useConversations'
import { useChat } from '@/hooks/useChat'
import { AppLayout } from '@/components/layout/AppLayout'
import { ChatWorkspace } from '@/components/chat/ChatWorkspace'

export function ChatPage() {
  const { user, signOut } = useAuth()
  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    renameConversation,
    deleteConversation,
  } = useConversations()

  const {
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
  } = useChat({
    conversationId: activeConversationId,
    onCreateConversation: async (firstMsg) => {
      const conv = await createConversation(firstMsg)
      return conv ? { id: conv.id } : null
    },
  })

  const handleNewChat = () => {
    setActiveConversationId(undefined)
  }

  return (
    <AppLayout
      conversations={conversations}
      activeConversationId={activeConversationId}
      activeConversationTitle={activeConversation?.title}
      onSelectConversation={(id) => setActiveConversationId(id)}
      onNewChat={handleNewChat}
      onRenameConversation={renameConversation}
      onDeleteConversation={deleteConversation}
      userEmail={user?.email}
      onSignOut={signOut}
    >
      {/* Optional In-app Error Toast */}
      {error && (
        <div className="mx-auto mt-2 flex max-w-2xl items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <ChatWorkspace
        messages={messages}
        input={input}
        setInput={setInput}
        onSend={() => sendMessage()}
        onStop={stopGeneration}
        onRegenerate={regenerateResponse}
        onEditAndResend={editAndResend}
        onSelectPrompt={(prompt) => {
          setInput(prompt)
        }}
        isGenerating={isGenerating}
        streamingMessage={streamingMessage}
      />
    </AppLayout>
  )
}
