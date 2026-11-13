import { useState, useMemo } from 'react'
import { Plus, Sparkles, Search, LogOut, PanelLeftClose, PanelLeft } from 'lucide-react'
import { Conversation, ConversationGroup } from '@/types/conversation'
import { ConversationItem } from './ConversationItem'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  conversations: Conversation[]
  activeConversationId?: string
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  onRenameConversation: (id: string, newTitle: string) => void
  onDeleteConversation: (id: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  userEmail?: string | null
  onSignOut?: () => void
}

function groupConversations(conversations: Conversation[]): ConversationGroup[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 24 * 60 * 60 * 1000
  const last7Days = today - 7 * 24 * 60 * 60 * 1000

  const groups: { [key: string]: Conversation[] } = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: [],
  }

  conversations.forEach((conv) => {
    const time = new Date(conv.updated_at || conv.created_at).getTime()
    if (time >= today) {
      groups.Today.push(conv)
    } else if (time >= yesterday) {
      groups.Yesterday.push(conv)
    } else if (time >= last7Days) {
      groups['Previous 7 Days'].push(conv)
    } else {
      groups.Older.push(conv)
    }
  })

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }))
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  isCollapsed,
  onToggleCollapse,
  userEmail,
  onSignOut,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const query = searchQuery.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(query))
  }, [conversations, searchQuery])

  const grouped = useMemo(
    () => groupConversations(filteredConversations),
    [filteredConversations]
  )

  if (isCollapsed) {
    return (
      <aside className="hidden md:flex flex-col items-center justify-between border-r border-sidebar-border bg-sidebar p-3 w-16 transition-all duration-200">
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={onToggleCollapse}
            className="rounded-lg p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <button
            onClick={onNewChat}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-transform active:scale-95"
            title="New Chat"
            aria-label="New Chat"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <ThemeToggle />
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="rounded-lg p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>
    )
  }

  return (
    <aside className="hidden md:flex flex-col justify-between border-r border-sidebar-border bg-sidebar w-64 lg:w-72 transition-all duration-200 select-none">
      {/* Top Header & Actions */}
      <div className="flex flex-col p-3 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">
              Gemini Chat
            </span>
          </div>
          <button
            onClick={onToggleCollapse}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <Button
          onClick={onNewChat}
          variant="outline"
          className="w-full justify-start space-x-2 border-border/70 bg-background/60 hover:bg-background shadow-xs text-xs font-medium h-9 rounded-xl"
        >
          <Plus className="h-4 w-4 text-primary" />
          <span>New Chat</span>
        </Button>

        {/* Quick Search / Filter */}
        {conversations.length > 5 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full rounded-lg border border-border/50 bg-background/40 py-1.5 pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:outline-none transition-all"
            />
          </div>
        )}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
        {grouped.length === 0 ? (
          <div className="px-2 py-8 text-center text-xs text-muted-foreground/70">
            {searchQuery ? 'No matching chats' : 'No conversations yet'}
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === activeConversationId}
                    onSelect={onSelectConversation}
                    onRename={onRenameConversation}
                    onDelete={onDeleteConversation}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* User Footer Profile */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center justify-between rounded-xl p-1.5 hover:bg-sidebar-accent/50 transition-colors">
          <div className="flex items-center space-x-2 min-w-0 pr-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary uppercase">
              {userEmail ? userEmail[0] : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {userEmail || 'User'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <ThemeToggle />
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
