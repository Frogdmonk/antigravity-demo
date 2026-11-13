import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  conversationTitle: string
  onConfirm: () => void
}

export function DeleteDialog({
  isOpen,
  onClose,
  conversationTitle,
  onConfirm,
}: DeleteDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Conversation"
      description={`Are you sure you want to delete "${conversationTitle}"? This will permanently delete all messages in this conversation.`}
    >
      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" onClick={handleConfirm}>
          Delete
        </Button>
      </div>
    </Dialog>
  )
}

