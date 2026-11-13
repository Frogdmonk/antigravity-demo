import React, { useRef, useEffect } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MessageComposerProps {
  input: string
  setInput: (value: string) => void
  onSend: () => void
  onStop?: () => void
  isGenerating: boolean
  placeholder?: string
  disabled?: boolean
}

export function MessageComposer({
  input,
  setInput,
  onSend,
  onStop,
  isGenerating,
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
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 min-h-[48px] max-h-[200px]"
          aria-label="Chat input"
        />

        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="text-[11px] text-muted-foreground/60 select-none">
            {input.length > 500 && (
              <span>{input.length} characters</span>
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
