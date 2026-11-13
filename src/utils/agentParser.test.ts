import { describe, it, expect } from 'vitest'
import { parseAgentContent, stripAgentBlocks } from './agentParser'

describe('parseAgentContent', () => {
  it('handles normal messages without agent tags', () => {
    const res = parseAgentContent('Hello world!', false)
    expect(res.hasAgentLoop).toBe(false)
    expect(res.finalAnswer).toBe('Hello world!')
  })

  it('detects active streaming <think> block', () => {
    const res = parseAgentContent('<think>Analyzing the user problem...', true)
    expect(res.hasAgentLoop).toBe(true)
    expect(res.isThinking).toBe(true)
    expect(res.thinking).toBe('Analyzing the user problem...')
    expect(res.tasks).toHaveLength(0)
  })

  it('detects completed <think> and in-progress <task>', () => {
    const raw =
      '<think>Plan ready.</think>\n<task title="1. Check syntax">Done checking.</task>\n<task title="2. Build solution">Working on implementation...'
    const res = parseAgentContent(raw, true)
    expect(res.hasAgentLoop).toBe(true)
    expect(res.isThinking).toBe(false)
    expect(res.thinking).toBe('Plan ready.')
    expect(res.isWorkingOnTasks).toBe(true)
    expect(res.tasks).toHaveLength(2)
    expect(res.tasks[0].status).toBe('completed')
    expect(res.tasks[0].title).toBe('1. Check syntax')
    expect(res.tasks[1].status).toBe('in_progress')
    expect(res.tasks[1].title).toBe('2. Build solution')
  })

  it('extracts completed tasks and final answer cleanly', () => {
    const raw = `<think>Reasoning step.</think>
<task title="1. Parse input">Parsed.</task>
<task title="2. Generate code">Generated.</task>
Here is the final answer in **Markdown**.`

    const res = parseAgentContent(raw, false)
    expect(res.hasAgentLoop).toBe(true)
    expect(res.tasks).toHaveLength(2)
    expect(res.tasks.every((t) => t.status === 'completed')).toBe(true)
    expect(res.finalAnswer).toBe('Here is the final answer in **Markdown**.')
    expect(stripAgentBlocks(raw)).toBe('Here is the final answer in **Markdown**.')
  })
})
