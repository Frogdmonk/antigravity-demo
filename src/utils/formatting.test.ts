import { describe, it, expect } from 'vitest'
import { generateConversationTitle, formatTimestamp } from './formatting'

describe('generateConversationTitle', () => {
  it('returns default title for empty or whitespace-only prompts', () => {
    expect(generateConversationTitle('')).toBe('New Chat')
    expect(generateConversationTitle('   ')).toBe('New Chat')
  })

  it('preserves clean short titles directly', () => {
    expect(generateConversationTitle('Hello Gemini')).toBe('Hello Gemini')
    expect(generateConversationTitle('What is React?')).toBe('What is React')
  })

  it('strips markdown code blocks, headers, and formatting marks', () => {
    const markdown = '# Quick Question\n```ts\nconst x = 1;\n```\nHow does this work?'
    const title = generateConversationTitle(markdown)
    expect(title).not.toContain('#')
    expect(title).not.toContain('```')
    expect(title).toBe('Quick Question')
  })

  it('truncates long questions at 42 characters with ellipsis', () => {
    const longPrompt = 'Can you please explain how quantum entanglement works in theoretical physics?'
    const title = generateConversationTitle(longPrompt)
    expect(title.length).toBeLessThanOrEqual(45)
    expect(title.endsWith('...')).toBe(true)
  })
})

describe('formatTimestamp', () => {
  it('formats valid ISO date string into readable hour and minute', () => {
    const result = formatTimestamp('2026-01-01T14:30:00Z')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('returns empty string for invalid date', () => {
    expect(formatTimestamp('not-a-date')).toBe('')
  })
})
