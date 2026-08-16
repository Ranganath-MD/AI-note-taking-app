import { restoreVersion } from "@/lib/notes-store"
import type { Note } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export function VersionHistoryDialog({
  note,
  open,
  onOpenChange,
}: {
  note: Note
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-2 rounded-none bg-popover p-3 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Version history</DialogTitle>
          <DialogDescription>
            Restore an earlier snapshot of this note. Canvas scenes stay on the latest save.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-80">
          {note.versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No snapshots yet. Approving a note or opening history creates one.
            </p>
          ) : (
            <div className="flex flex-col">
              {note.versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-start justify-between gap-2 border-b border-border p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{version.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{version.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(version.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-none"
                    onClick={() => {
                      restoreVersion(note.id, version.id)
                      onOpenChange(false)
                    }}
                  >
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
