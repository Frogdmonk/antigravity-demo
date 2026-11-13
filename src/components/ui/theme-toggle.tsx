import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  return (
    <Button
      variant="ghost"
      size={showLabel ? 'sm' : 'iconSm'}
      onClick={cycleTheme}
      title={`Theme: ${theme} (Click to switch)`}
      className="text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'system' ? (
        <Monitor className="h-4 w-4" />
      ) : resolvedTheme === 'dark' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      {showLabel && (
        <span className="ml-2 capitalize text-xs">
          {theme}
        </span>
      )}
    </Button>
  )
}
