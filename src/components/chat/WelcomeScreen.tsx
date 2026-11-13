import { Sparkles, Code2, Lightbulb, Compass, MessageSquareQuote } from 'lucide-react'

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void
}

const SUGGESTED_PROMPTS = [
  {
    icon: Code2,
    title: 'Code Refactoring',
    prompt: 'Review this code snippet and suggest performance and readability improvements.',
  },
  {
    icon: Lightbulb,
    title: 'Brainstorm Ideas',
    prompt: 'Give me 5 creative ideas for a modern web application using AI.',
  },
  {
    icon: Compass,
    title: 'Explain Complex Topics',
    prompt: 'Explain how Row Level Security (RLS) works in PostgreSQL with simple analogies.',
  },
  {
    icon: MessageSquareQuote,
    title: 'Draft Communication',
    prompt: 'Write a professional email confirming project scope and delivery timelines.',
  },
]

export function WelcomeScreen({ onSelectPrompt }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center animate-fade-in">
      {/* Brand Sparkle Icon */}
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent border border-primary/20 shadow-inner">
        <Sparkles className="h-8 w-8 text-primary animate-pulse-subtle" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
        How can I help you today?
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Fast, contextual AI assistant powered by Google Gemini. Ask questions, explore ideas, or analyze code.
      </p>

      {/* Suggested Prompt Cards */}
      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 text-left">
        {SUGGESTED_PROMPTS.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={index}
              onClick={() => onSelectPrompt(item.prompt)}
              className="group flex flex-col justify-between rounded-xl border border-border/80 bg-card/60 p-4 transition-all hover:border-primary/40 hover:bg-card hover:shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center space-x-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {item.title}
                </span>
              </div>
              <p className="mt-2.5 line-clamp-2 text-xs text-muted-foreground group-hover:text-foreground/90 transition-colors">
                {item.prompt}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
