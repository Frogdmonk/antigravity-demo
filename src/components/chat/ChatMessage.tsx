import { useState } from 'react'
import { Sparkles, Copy, Check, RotateCw, Pencil, AlertCircle, StopCircle } from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import { Message } from '@/types/chat'
import { Button } from '@/components/ui/button'

interface ChatMessageProps {
  message: Message
  isLastAssistant?: boolean
  isGenerating?: boolean
  onRegenerate?: () => void
  onEditAndResend?: (messageId: string, newContent: string) => void
}

export function ChatMessage({
  message,
  isLastAssistant = false,
  isGenerating = false,
  onRegenerate,
  onEditAndResend,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)

  const isUser = message.role === 'user'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleSaveEdit = () => {
    if (!editContent.trim()) return
    onEditAndResend?.(message.id, editContent.trim())
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  return (
    <div
      className={`group w-full py-4 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-muted/20 border-y border-border/40'
      }`}
    >
      <div className="mx-auto flex max-w-3xl items-start space-x-3 sm:space-x-4 px-4">
        {/* Avatar */}
        <div className="flex-shrink-0 pt-0.5">
          {isUser ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground border border-border select-none">
              U
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm select-none">
              <Sparkles className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 pb-1">
            <span className="text-xs font-semibold text-foreground select-none">
              {isUser ? 'You' : 'Gemini'}
            </span>

            {/* Status indicators */}
            {!isUser && message.status === 'interrupted' && (
              <span className="inline-flex items-center space-x-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <StopCircle className="h-3 w-3" />
                <span>Interrupted</span>
              </span>
            )}

            {!isUser && message.status === 'failed' && (
              <span className="inline-flex items-center space-x-1 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive border border-destructive/20">
                <AlertCircle className="h-3 w-3" />
                <span>Failed</span>
              </span>
            )}
          </div>

          {/* User Message Edit Mode */}
          {isUser && isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[72px]"
                autoFocus
              />
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="default" onClick={handleSaveEdit}>
                  Save & Resend
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* Message Content */
            <div className="text-sm">
              {isUser ? (
                <div className="whitespace-pre-wrap leading-relaxed text-foreground">
                  {message.content}
                </div>
              ) : (
                <MarkdownRenderer content={message.content} />
              )}
            </div>
          )}

          {/* Message Actions */}
          <div className="mt-2.5 flex items-center space-x-1 text-xs text-muted-foreground select-none">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1 rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Copy response"
              aria-label="Copy message"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[11px] text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>

            {/* Edit Button for User Message */}
            {isUser && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center space-x-1 rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Edit message"
                aria-label="Edit message"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="text-[11px]">Edit</span>
              </button>
            )}

            {/* Regenerate Button for Assistant (when not generating) */}
            {!isUser && isLastAssistant && !isGenerating && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="inline-flex items-center space-x-1 rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Regenerate response"
                aria-label="Regenerate response"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span className="text-[11px]">Regenerate</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

