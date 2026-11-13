import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn utility', () => {
  it('merges class names cleanly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('resolves conflicting tailwind classes in favor of last one', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('filters out falsy and conditional values', () => {
    const isHidden = false
    const isActive = true
    expect(cn('base', isHidden && 'hidden', isActive && 'active', null, undefined)).toBe('base active')
  })
})

