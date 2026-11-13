export interface AgentTaskItem {
  id: string
  title: string
  detail: string
  status: 'in_progress' | 'completed'
}

export interface ParsedAgentContent {
  hasAgentLoop: boolean
  thinking: string
  isThinking: boolean
  tasks: AgentTaskItem[]
  isWorkingOnTasks: boolean
  finalAnswer: string
}

/**
 * Parses streamed or completed assistant content containing:
 * <think>...</think>
 * <task title="...">...</task>
 * followed by the final Markdown response.
 */
export function parseAgentContent(raw: string, isStreaming = false): ParsedAgentContent {
  if (!raw) {
    return {
      hasAgentLoop: false,
      thinking: '',
      isThinking: false,
      tasks: [],
      isWorkingOnTasks: false,
      finalAnswer: '',
    }
  }

  const hasThinkStart = raw.includes('<think>')
  const hasTaskStart = raw.includes('<task')

  if (!hasThinkStart && !hasTaskStart) {
    return {
      hasAgentLoop: false,
      thinking: '',
      isThinking: false,
      tasks: [],
      isWorkingOnTasks: false,
      finalAnswer: raw,
    }
  }

  let working = raw
  let thinking = ''
  let isThinking = false

  // 1. Extract <think>...</think>
  const thinkCompleteMatch = working.match(/<think>([\s\S]*?)<\/think>/)
  if (thinkCompleteMatch) {
    thinking = thinkCompleteMatch[1].trim()
    working = working.replace(thinkCompleteMatch[0], '')
  } else if (hasThinkStart) {
    const thinkOpenIndex = working.indexOf('<think>')
    thinking = working.slice(thinkOpenIndex + 7).trim()
    isThinking = isStreaming
    working = working.slice(0, thinkOpenIndex)
  }

  // 2. Extract completed <task title="...">...</task> blocks
  const tasks: AgentTaskItem[] = []
  const completedTaskRegex = /<task(?:\s+title="([^"]*)")?\s*>([\s\S]*?)<\/task>/g
  let match: RegExpExecArray | null
  let taskIndex = 0

  while ((match = completedTaskRegex.exec(working)) !== null) {
    taskIndex++
    tasks.push({
      id: `task-${taskIndex}`,
      title: (match[1] || `Task ${taskIndex}`).trim(),
      detail: (match[2] || '').trim(),
      status: 'completed',
    })
  }

  // Remove all completed <task>...</task> blocks from working text
  working = working.replace(completedTaskRegex, '')

  // 3. Check if there is an in-progress (unclosed) <task ...> block currently streaming
  let isWorkingOnTasks = false
  const unclosedTaskMatch = working.match(/<task(?:\s+title="([^"]*)")?\s*>([\s\S]*)$/)
  if (unclosedTaskMatch) {
    taskIndex++
    isWorkingOnTasks = isStreaming
    tasks.push({
      id: `task-${taskIndex}`,
      title: (unclosedTaskMatch[1] || `Task ${taskIndex}`).trim(),
      detail: (unclosedTaskMatch[2] || '').trim(),
      status: isStreaming ? 'in_progress' : 'completed',
    })
    working = working.slice(0, unclosedTaskMatch.index)
  } else if (isStreaming && /<task[^>]*$/.test(working)) {
    // Partial opening <task tag still being typed out
    isWorkingOnTasks = true
    working = working.replace(/<task[^>]*$/, '')
  }

  // Also strip partial opening <think tag if any
  working = working.replace(/<\/?think[^>]*$/g, '').trim()

  return {
    hasAgentLoop: true,
    thinking,
    isThinking,
    tasks,
    isWorkingOnTasks,
    finalAnswer: working,
  }
}

/**
 * Strips <think> and <task> agent blocks to return only the clean final answer
 * (used for clipboard copy and clean conversation context history).
 */
export function stripAgentBlocks(raw: string): string {
  const parsed = parseAgentContent(raw, false)
  if (!parsed.hasAgentLoop) return raw
  return parsed.finalAnswer || raw
}
