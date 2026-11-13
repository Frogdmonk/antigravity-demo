/**
 * Deterministically generates a clean, concise conversation title from the first user prompt.
 * Does not make an extra AI call.
 */
export function generateConversationTitle(prompt: string): string {
  if (!prompt || !prompt.trim()) return 'New Chat'

  // Remove code blocks, markdown symbols, and leading/trailing whitespace
  const clean = prompt
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*`_~>[\]()]/g, '')
    .trim()

  if (!clean) return 'New Chat'

  // Look for first sentence or newline
  const firstLine = clean.split('\n')[0].trim()
  const firstSentence = firstLine.split(/[.?!]/)[0].trim()

  const candidate = firstSentence.length > 5 ? firstSentence : firstLine

  // Limit to 42 characters max
  if (candidate.length <= 42) {
    return candidate
  }

  return candidate.slice(0, 42).trim() + '...'
}

/**
 * Format relative or standard timestamp
 */
export function formatTimestamp(dateString: string): string {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date)
  } catch {
    return ''
  }
}
