import React, { useState } from 'react'
import { MessageSquare, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Conversation } from '@/types/conversation'
import { RenameDialog } from '@/components/conversation/RenameDialog'
import { DeleteDialog } from '@/components/conversation/DeleteDialog'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: (id: string) => void
  onRename: (id: string, newTitle: string) => void
  onDelete: (id: string) => void
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: ConversationItemProps) {
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(!menuOpen)
  }

  return (
    <>
      <div
        onClick={() => onSelect(conversation.id)}
        className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer select-none ${
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
        }`}
      >
        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
          <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
          <span className="truncate">{conversation.title || 'Untitled conversation'}</span>
        </div>

        {/* Action button trigger */}
        <div className="relative flex-shrink-0">
          <button
            onClick={handleMenuClick}
            className={`rounded p-1 text-muted-foreground transition-opacity hover:text-foreground ${
              isActive || menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            title="Conversation options"
            aria-label="Conversation options"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          {/* Context popover menu */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                }}
              />
              <div
                className="absolute right-0 top-6 z-50 w-32 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    setIsRenameOpen(true)
                  }}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground text-left"
                >
                  <Pencil className="h-3.5 w-3.5 opacity-70" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    setIsDeleteOpen(true)
                  }}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 text-left"
                >
                  <Trash2 className="h-3.5 w-3.5 opacity-70" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <RenameDialog
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        currentTitle={conversation.title}
        onRename={(newTitle) => onRename(conversation.id, newTitle)}
      />

      <DeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        conversationTitle={conversation.title}
        onConfirm={() => onDelete(conversation.id)}
      />
    </>
  )
}
