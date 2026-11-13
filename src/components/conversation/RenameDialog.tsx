import { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface RenameDialogProps {
  isOpen: boolean
  onClose: () => void
  currentTitle: string
  onRename: (newTitle: string) => void
}

export function RenameDialog({
  isOpen,
  onClose,
  currentTitle,
  onRename,
}: RenameDialogProps) {
  const [title, setTitle] = useState(currentTitle)

  useEffect(() => {
    setTitle(currentTitle)
  }, [currentTitle, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onRename(title.trim())
    onClose()
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Rename Conversation"
      description="Enter a new title for this conversation."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Conversation title"
          autoFocus
          className="w-full"
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="default" disabled={!title.trim()}>
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
