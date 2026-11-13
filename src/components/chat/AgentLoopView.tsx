import { useState } from 'react'
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ListTodo,
  Loader2,
} from 'lucide-react'
import type { ParsedAgentContent } from '@/utils/agentParser'

interface AgentLoopViewProps {
  parsed: ParsedAgentContent
}

export function AgentLoopView({ parsed }: AgentLoopViewProps) {
  const { thinking, isThinking, tasks, isWorkingOnTasks } = parsed
  const [isThinkExpanded, setIsThinkExpanded] = useState(true)
  const [isTasksExpanded, setIsTasksExpanded] = useState(true)

  const completedCount = tasks.filter((t) => t.status === 'completed').length

  return (
    <div className="mb-3 space-y-2">
      {/* 1. Thinking Block */}
      {(thinking || isThinking) && (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card/60 shadow-2xs transition-all">
          <button
            type="button"
            onClick={() => setIsThinkExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors select-none"
          >
            <div className="flex items-center space-x-2">
              {isThinking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <Brain className="h-3.5 w-3.5 text-primary" />
              )}
              <span>
                {isThinking ? 'Thinking and planning...' : 'Thought Process'}
              </span>
            </div>
            {isThinkExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 opacity-70" />
            )}
          </button>

          {isThinkExpanded && thinking && (
            <div className="border-t border-border/50 bg-muted/20 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground italic whitespace-pre-wrap">
              {thinking}
            </div>
          )}
        </div>
      )}

      {/* 2. Agent Task Loop Block */}
      {tasks.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card/60 shadow-2xs transition-all">
          <button
            type="button"
            onClick={() => setIsTasksExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors select-none"
          >
            <div className="flex items-center space-x-2">
              {isWorkingOnTasks ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <ListTodo className="h-3.5 w-3.5 text-emerald-500" />
              )}
              <span className="text-foreground/90">
                {isWorkingOnTasks
                  ? `Executing Tasks (${completedCount}/${tasks.length})`
                  : `Completed ${tasks.length} ${tasks.length === 1 ? 'Task' : 'Tasks'}`}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {completedCount}/{tasks.length}
              </span>
              {isTasksExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 opacity-70" />
              )}
            </div>
          </button>

          {isTasksExpanded && (
            <div className="divide-y divide-border/40 border-t border-border/50 bg-background/40">
              {tasks.map((task, idx) => {
                const isRunning = task.status === 'in_progress'
                return (
                  <div
                    key={task.id || idx}
                    className={`flex items-start space-x-2.5 px-3.5 py-2.5 text-xs transition-colors ${
                      isRunning ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {isRunning ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="font-medium text-foreground">
                        {task.title}
                      </div>
                      {task.detail && (
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          {task.detail}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
