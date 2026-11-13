import { Menu, Plus, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  conversationTitle?: string
  onOpenMobileMenu: () => void
  onNewChat: () => void
}

export function Header({
  conversationTitle,
  onOpenMobileMenu,
  onNewChat,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/40 bg-background/80 px-3 sm:px-4 backdrop-blur-md select-none">
      <div className="flex items-center space-x-2 min-w-0">
        {/* Mobile Hamburger */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Open conversation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Current Conversation Title */}
        <div className="flex items-center space-x-2 min-w-0">
          <div className="hidden sm:flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <h2 className="truncate text-xs sm:text-sm font-semibold text-foreground">
            {conversationTitle || 'Gemini Chat'}
          </h2>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-1.5">
        <Button
          onClick={onNewChat}
          variant="ghost"
          size="sm"
          className="h-8 space-x-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          title="Start new conversation"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Chat</span>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}
