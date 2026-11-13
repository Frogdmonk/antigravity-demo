import React, { useState } from 'react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { MobileSidebar } from '@/components/sidebar/MobileSidebar'
import { Header } from '@/components/layout/Header'
import { Conversation } from '@/types/conversation'

interface AppLayoutProps {
  children: React.ReactNode
  conversations: Conversation[]
  activeConversationId?: string
  activeConversationTitle?: string
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  onRenameConversation: (id: string, newTitle: string) => void
  onDeleteConversation: (id: string) => void
  userEmail?: string | null
  onSignOut?: () => void
}

export function AppLayout({
  children,
  conversations,
  activeConversationId,
  activeConversationTitle,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  userEmail,
  onSignOut,
}: AppLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onNewChat={onNewChat}
        onRenameConversation={onRenameConversation}
        onDeleteConversation={onDeleteConversation}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        userEmail={userEmail}
        onSignOut={onSignOut}
      />

      {/* Mobile Drawer */}
      <MobileSidebar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onNewChat={onNewChat}
        onRenameConversation={onRenameConversation}
        onDeleteConversation={onDeleteConversation}
        userEmail={userEmail}
        onSignOut={onSignOut}
      />

      {/* Main Chat Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          conversationTitle={activeConversationTitle}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onNewChat={onNewChat}
        />
        <main className="flex flex-1 flex-col overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  )
}
