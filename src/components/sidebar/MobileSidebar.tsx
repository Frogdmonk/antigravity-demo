import { useEffect } from 'react'
import { X, Sparkles, Plus, LogOut } from 'lucide-react'
import { Conversation } from '@/types/conversation'
import { ConversationItem } from './ConversationItem'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  conversations: Conversation[]
  activeConversationId?: string
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  onRenameConversation: (id: string, newTitle: string) => void
  onDeleteConversation: (id: string) => void
  userEmail?: string | null
  onSignOut?: () => void
}

export function MobileSidebar({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  userEmail,
  onSignOut,
}: MobileSidebarProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between bg-sidebar border-r border-sidebar-border text-sidebar-foreground shadow-2xl transition-transform animate-fade-in">
        {/* Top Header */}
        <div className="flex flex-col p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sm tracking-tight">
                Gemini Chat
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <Button
            onClick={() => {
              onNewChat()
              onClose()
            }}
            variant="outline"
            className="w-full justify-start space-x-2 border-border/70 bg-background/60 shadow-xs text-xs font-medium h-9 rounded-xl"
          >
            <Plus className="h-4 w-4 text-primary" />
            <span>New Chat</span>
          </Button>
        </div>

        {/* Conversations Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
          {conversations.length === 0 ? (
            <div className="px-2 py-8 text-center text-xs text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onSelect={(id) => {
                  onSelectConversation(id)
                  onClose()
                }}
                onRename={onRenameConversation}
                onDelete={onDeleteConversation}
              />
            ))
          )}
        </div>

        {/* Footer Profile */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 pr-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary uppercase">
                {userEmail ? userEmail[0] : 'U'}
              </div>
              <p className="truncate text-xs font-medium">
                {userEmail || 'User'}
              </p>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <ThemeToggle />
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
