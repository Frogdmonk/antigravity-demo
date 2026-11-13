import React, { useRef, useEffect } from 'react'
import { ArrowUp, Square, BrainCircuit } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MessageComposerProps {
  input: string
  setInput: (value: string) => void
  onSend: () => void
  onStop?: () => void
  isGenerating: boolean
  agentMode?: boolean
  onToggleAgentMode?: () => void
  placeholder?: string
  disabled?: boolean
}

export function MessageComposer({
  input,
  setInput,
  onSend,
  onStop,
  isGenerating,
  agentMode = true,
  onToggleAgentMode,
  placeholder = 'Message Gemini...',
  disabled = false,
}: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea according to scrollHeight
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    const newHeight = Math.min(textarea.scrollHeight, 200)
    textarea.style.height = `${Math.max(newHeight, 48)}px`
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isGenerating && input.trim() && !disabled) {
        onSend()
      }
    }
  }

  const canSubmit = input.trim().length > 0 && !disabled && !isGenerating

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      <div
        className={`relative flex flex-col rounded-2xl border transition-all duration-200 bg-card/90 backdrop-blur-md shadow-sm ${
          isGenerating
            ? 'border-primary/50 ring-1 ring-primary/20'
            : 'border-border hover:border-border/80 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20'
        }`}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            agentMode
              ? 'Ask Gemini Agent to think and execute tasks...'
              : placeholder
          }
          disabled={disabled}
          rows={1}
          className="w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 min-h-[48px] max-h-[200px]"
          aria-label="Chat input"
        />

        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="flex items-center space-x-2">
            {onToggleAgentMode && (
              <button
                type="button"
                onClick={onToggleAgentMode}
                title={
                  agentMode
                    ? 'Agentic Loop Active: Thinks first and breaks work into tasks'
                    : 'Click to enable Agentic Loop (Think + Tasks)'
                }
                className={`inline-flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all select-none ${
                  agentMode
                    ? 'border-primary/40 bg-primary/10 text-primary shadow-2xs'
                    : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <BrainCircuit className="h-3.5 w-3.5" />
                <span>Agent Loop: {agentMode ? 'On' : 'Off'}</span>
              </button>
            )}

            {input.length > 500 && (
              <span className="text-[11px] text-muted-foreground/60 select-none">
                {input.length} chars
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            {isGenerating ? (
              <Button
                type="button"
                size="iconSm"
                variant="destructive"
                onClick={onStop}
                title="Stop generation"
                aria-label="Stop generation"
                className="h-8 w-8 rounded-xl shadow-sm transition-transform active:scale-95"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                type="button"
                size="iconSm"
                variant="default"
                disabled={!canSubmit}
                onClick={onSend}
                title="Send message (Enter)"
                aria-label="Send message"
                className="h-8 w-8 rounded-xl shadow-sm transition-transform active:scale-95 disabled:opacity-30 disabled:scale-100"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-muted-foreground/75 select-none">
        Gemini Chat can make mistakes. Verify important information.
      </p>
    </div>
  )
}
