import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'

interface MarkdownRendererProps {
  content: string
}

function isSafeUrl(url?: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url, 'https://placeholder.local')
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words text-foreground leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const codeString = String(children).replace(/\n$/, '')
            const isInline = !match && !codeString.includes('\n')

            if (isInline) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground border border-border/40"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return (
              <CodeBlock language={match ? match[1] : undefined}>
                {codeString}
              </CodeBlock>
            )
          },
          a({ href, children, ...props }) {
            const safe = isSafeUrl(href)
            if (!safe) {
              return <span>{children}</span>
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                {...props}
              >
                {children}
              </a>
            )
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs border-collapse">
                  {children}
                </table>
              </div>
            )
          },
          thead({ children }) {
            return (
              <thead className="border-b border-border bg-muted/60 text-muted-foreground font-semibold">
                {children}
              </thead>
            )
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-border/60">{children}</tbody>
          },
          th({ children }) {
            return <th className="px-3.5 py-2.5 font-medium">{children}</th>
          },
          td({ children }) {
            return <td className="px-3.5 py-2">{children}</td>
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-3 border-l-2 border-primary/60 pl-4 italic text-muted-foreground">
                {children}
              </blockquote>
            )
          },
          h1({ children }) {
            return <h1 className="mt-4 mb-2 text-xl font-bold tracking-tight text-foreground">{children}</h1>
          },
          h2({ children }) {
            return <h2 className="mt-3 mb-2 text-lg font-semibold tracking-tight text-foreground">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="mt-2.5 mb-1.5 text-base font-semibold text-foreground">{children}</h3>
          },
          p({ children }) {
            return <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>
          },
          ul({ children }) {
            return <ul className="mb-3 list-disc pl-5 space-y-1">{children}</ul>
          },
          ol({ children }) {
            return <ol className="mb-3 list-decimal pl-5 space-y-1">{children}</ol>
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>
          },
          hr() {
            return <hr className="my-4 border-border" />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
