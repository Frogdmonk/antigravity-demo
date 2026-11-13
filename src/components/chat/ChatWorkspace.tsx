import { useRef, useEffect } from 'react'
import { Message } from '@/types/chat'
import { ChatMessage } from './ChatMessage'
import { MessageComposer } from './MessageComposer'
import { WelcomeScreen } from './WelcomeScreen'
import { StreamingIndicator } from './StreamingIndicator'

interface ChatWorkspaceProps {
  messages: Message[]
  input: string
  setInput: (value: string) => void
  onSend: () => void
  onStop?: () => void
  onRegenerate?: () => void
  onEditAndResend?: (messageId: string, newContent: string) => void
  onSelectPrompt: (prompt: string) => void
  isGenerating: boolean
  streamingMessage?: string
  agentMode?: boolean
  onToggleAgentMode?: () => void
}

export function ChatWorkspace({
  messages,
  input,
  setInput,
  onSend,
  onStop,
  onRegenerate,
  onEditAndResend,
  onSelectPrompt,
  isGenerating,
  streamingMessage,
  agentMode = true,
  onToggleAgentMode,
}: ChatWorkspaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages or streaming chunks
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingMessage, isGenerating])

  const hasMessages = messages.length > 0 || !!streamingMessage

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth py-4 space-y-1"
      >
        {!hasMessages ? (
          <WelcomeScreen onSelectPrompt={onSelectPrompt} />
        ) : (
          <div className="flex flex-col space-y-1">
            {messages.map((message, index) => {
              const isLast = index === messages.length - 1
              const isLastAssistant = isLast && message.role === 'assistant'
              return (
                <ChatMessage
                  key={message.id || index}
                  message={message}
                  isLastAssistant={isLastAssistant}
                  isGenerating={isGenerating}
                  onRegenerate={onRegenerate}
                  onEditAndResend={onEditAndResend}
                />
              )
            })}

            {/* In-flight streaming message representation */}
            {isGenerating && streamingMessage && (
              <ChatMessage
                message={{
                  id: 'streaming-temp',
                  conversation_id: 'temp',
                  role: 'assistant',
                  content: streamingMessage,
                  status: 'pending',
                  created_at: '',
                  updated_at: '',
                }}
                isLastAssistant={true}
                isGenerating={true}
              />
            )}

            {/* Streaming indicator when waiting for first token */}
            {isGenerating && !streamingMessage && (
              <div className="mx-auto max-w-3xl px-4 py-2">
                <StreamingIndicator
                  text={
                    agentMode
                      ? 'Agent is initializing thinking & task loop...'
                      : 'Gemini is thinking...'
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer Container */}
      <div className="flex-shrink-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-2">
        <MessageComposer
          input={input}
          setInput={setInput}
          onSend={onSend}
          onStop={onStop}
          isGenerating={isGenerating}
          agentMode={agentMode}
          onToggleAgentMode={onToggleAgentMode}
        />
      </div>
    </div>
  )
}
