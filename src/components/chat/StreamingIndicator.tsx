export function StreamingIndicator({ text = 'Gemini is thinking...' }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2 py-1 text-xs text-muted-foreground animate-fade-in select-none">
      <div className="flex items-center space-x-1">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <span
          className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
          style={{ animationDelay: '200ms' }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
          style={{ animationDelay: '400ms' }}
        />
      </div>
      <span>{text}</span>
    </div>
  )
}
