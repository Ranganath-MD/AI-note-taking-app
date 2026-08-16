import { useSelector } from "@tanstack/react-store"
import type { Editor } from "@tiptap/react"
import { Clock, ChevronRight, Star } from "lucide-react"
import { lazy, Suspense, useCallback, useEffect, useState } from "react"

import { NoteToolbar } from "@/components/noteflow/note-toolbar"
import { TextEditor } from "@/components/noteflow/text-editor"
import { VersionHistoryDialog } from "@/components/noteflow/version-history-dialog"
import { formatSavedAgo } from "@/lib/format"
import { canvasStatsStore, notesStore, togglePinned } from "@/lib/notes-store"
import type { Note } from "@/lib/types"
import { cn } from "@/lib/utils"

const ExcalidrawBoard = lazy(() => import("@/components/noteflow/excalidraw-board"))

export function EditorArea({ note }: { note: Note | undefined }) {
  const theme = useSelector(notesStore, (state) => state.theme)
  const folders = useSelector(notesStore, (state) => state.folders)
  const [mounted, setMounted] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)
  const folderName = folders.find((folder) => folder.id === note?.folderId)?.name ?? "Notes"
  const handleEditor = useCallback((next: Editor | null) => setEditor(next), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!note) {
    return (
      <section className="flex h-full min-h-0 min-w-0 flex-1 items-center justify-center bg-background text-sm text-muted-foreground">
        Create a folder, then add a note to start writing.
      </section>
    )
  }

  return (
      <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="flex h-9 shrink-0 items-center border-b border-border px-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{folderName}</span>
          <ChevronRight className="size-3 text-muted-foreground" />
          <h1 className="truncate text-sm font-semibold">{note.title}</h1>
          <button
            type="button"
            aria-label="Pin note"
            onClick={() => togglePinned(note.id)}
            className="text-amber-400"
          >
            <Star className={cn("size-3.5", note.pinned && "fill-amber-400")} />
          </button>
          <button
            type="button"
            aria-label="Version history"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setHistoryOpen(true)}
          >
            <Clock className="size-3.5" />
          </button>
        </div>
      </header>

      <NoteToolbar note={note} editor={note.viewMode === "text" ? editor : null} />

      <div className="min-h-0 flex-1 overflow-hidden">
        {note.viewMode === "text" ? (
          <TextEditor note={note} onEditor={handleEditor} />
        ) : mounted ? (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading Excalidraw...
              </div>
            }
          >
            <ExcalidrawBoard noteId={note.id} theme={theme} />
          </Suspense>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading Excalidraw...
          </div>
        )}
      </div>

      <VersionHistoryDialog note={note} open={historyOpen} onOpenChange={setHistoryOpen} />
    </section>
  )
}
