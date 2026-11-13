import { describe, it, expect } from 'vitest'
import { formatGeminiContents, type ChatMessageInput } from './gemini'

describe('formatGeminiContents', () => {
  it('maps assistant role to model role', () => {
    const input: ChatMessageInput[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ]
    const contents = formatGeminiContents(input)
    expect(contents).toHaveLength(2)
    expect(contents[0].role).toBe('user')
    expect(contents[0].parts[0].text).toBe('Hello')
    expect(contents[1].role).toBe('model')
    expect(contents[1].parts[0].text).toBe('Hi there')
  })

  it('ensures conversation begins with a user turn', () => {
    const input: ChatMessageInput[] = [
      { role: 'assistant', content: 'Leftover greeting' },
      { role: 'user', content: 'First user prompt' },
    ]
    const contents = formatGeminiContents(input)
    expect(contents[0].role).toBe('user')
    expect(contents[0].parts[0].text).toBe('First user prompt')
  })

  it('merges consecutive messages of identical role', () => {
    const input: ChatMessageInput[] = [
      { role: 'user', content: 'Part 1' },
      { role: 'user', content: 'Part 2' },
    ]
    const contents = formatGeminiContents(input)
    expect(contents).toHaveLength(1)
    expect(contents[0].parts[0].text).toContain('Part 1')
    expect(contents[0].parts[0].text).toContain('Part 2')
  })

  it('respects max context window limit', () => {
    const input: ChatMessageInput[] = []
    for (let i = 0; i < 30; i++) {
      input.push({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      })
    }
    const contents = formatGeminiContents(input, 10)
    expect(contents.length).toBeLessThanOrEqual(10)
    // Most recent message should be present
    expect(contents[contents.length - 1].parts[0].text).toBe('Message 29')
  })
})
