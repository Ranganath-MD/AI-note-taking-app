import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"

export function NameDialog({
  open,
  title,
  description,
  label,
  initialValue,
  confirmLabel,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  title: string
  description: string
  label: string
  initialValue?: string
  confirmLabel: string
  onOpenChange: (open: boolean) => void
  onSubmit: (value: string) => void
}) {
  const [value, setValue] = useState(initialValue ?? "")

  useEffect(() => {
    if (open) setValue(initialValue ?? "")
  }, [open, initialValue])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-2 rounded-none bg-popover p-3 sm:max-w-md">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const next = value.trim()
            if (!next) return
            onSubmit(next)
            onOpenChange(false)
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <label className="mt-2 block text-xs font-medium text-muted-foreground">
            {label}
            <Input
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="mt-1 rounded-none"
            />
          </label>
          <DialogFooter className="mt-3">
            <Button type="button" variant="outline" className="rounded-none" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-none">
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-2 rounded-none bg-popover p-3 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" className="rounded-none" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="rounded-none"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
