import { useSelector } from "@tanstack/react-store"
import {
  ChevronRight,
  Folder,
  FolderPlus,
  MoreVertical,
  Moon,
  Plus,
  Search,
  SquarePen,
  Star,
  Sun,
} from "lucide-react"
import { useState } from "react"

import { ConfirmDialog, NameDialog } from "@/components/noteflow/dialogs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatBytes, formatNoteTime, snippetFromBody } from "@/lib/format"
import {
  createFolder,
  createNote,
  deleteFolder,
  deleteNote,
  duplicateNote,
  moveNote,
  notesStore,
  renameFolder,
  selectNote,
  setSearch,
  setTheme,
  toggleFolder,
  togglePinned,
  commitNoteTitle,
} from "@/lib/notes-store"
import type { Folder as FolderType, Note, NoteTag } from "@/lib/types"
import { cn } from "@/lib/utils"

const tagClass: Record<NoteTag["tone"], string> = {
  urgent: "bg-red-500/10 text-red-500",
  idea: "bg-indigo-500/10 text-indigo-400",
  meeting: "bg-emerald-500/10 text-emerald-400",
  personal: "bg-amber-500/10 text-amber-400",
}

function matchesSearch(note: Note, query: string) {
  if (!query.trim()) return true
  const haystack = `${note.title} ${snippetFromBody(note.body, 10_000)} ${note.tag?.label ?? ""}`.toLowerCase()
  return haystack.includes(query.trim().toLowerCase())
}

type DialogState =
  | { type: "create-folder" }
  | { type: "rename-folder"; id: string; name: string }
  | { type: "rename-note"; id: string; name: string }
  | { type: "delete-folder"; id: string; name: string; count: number }
  | { type: "delete-note"; id: string; name: string }
  | null

export function AppSidebar() {
  const notes = useSelector(notesStore, (state) => state.notes)
  const folders = useSelector(notesStore, (state) => state.folders)
  const selectedId = useSelector(notesStore, (state) => state.selectedId)
  const search = useSelector(notesStore, (state) => state.search)
  const expanded = useSelector(notesStore, (state) => state.expanded)
  const theme = useSelector(notesStore, (state) => state.theme)
  const bytes = useSelector(notesStore, (state) => state.bytes)
  const [dialog, setDialog] = useState<DialogState>(null)

  const pinnedNotes = notes.filter((note) => note.pinned && matchesSearch(note, search))

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-9 items-center gap-2 border-b border-sidebar-border px-2">
        <div className="flex size-6 items-center justify-center bg-primary">
          <SquarePen className="size-3.5 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold tracking-wide">NoteFlow</span>
      </div>

      <div className="border-b border-sidebar-border">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="note-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="h-8 rounded-none border-0 border-b border-border bg-background pr-12 pl-7 text-xs"
          />
          <Kbd className="absolute top-1/2 right-1 h-5 -translate-y-1/2 rounded-none border border-border bg-card px-1 font-mono text-[10px]">
            ⌘K
          </Kbd>
        </div>
        <div className="grid grid-cols-2">
          <Button
            size="sm"
            className="h-8 rounded-none text-xs"
            onClick={() => createNote(folders[0]?.id)}
            disabled={folders.length === 0}
          >
            <Plus className="size-3.5" />
            New note
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-none border-y-0 border-r-0 text-xs"
            onClick={() => setDialog({ type: "create-folder" })}
          >
            <FolderPlus className="size-3.5" />
            New folder
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav>
          <TreeSection
            id="pinned"
            label="Pinned"
            icon={Star}
            open={expanded.pinned !== false}
            notes={pinnedNotes}
            selectedId={selectedId}
            folders={folders}
            onRenameNote={(note) => setDialog({ type: "rename-note", id: note.id, name: note.title })}
            onDeleteNote={(note) => setDialog({ type: "delete-note", id: note.id, name: note.title })}
          />
          {folders.map((folder) => (
            <TreeSection
              key={folder.id}
              id={folder.id}
              label={folder.name}
              icon={Folder}
              open={expanded[folder.id] !== false}
              notes={notes.filter((note) => note.folderId === folder.id && matchesSearch(note, search))}
              selectedId={selectedId}
              folders={folders}
              onAddNote={() => createNote(folder.id)}
              onRenameFolder={() => setDialog({ type: "rename-folder", id: folder.id, name: folder.name })}
              onDeleteFolder={() =>
                setDialog({
                  type: "delete-folder",
                  id: folder.id,
                  name: folder.name,
                  count: notes.filter((note) => note.folderId === folder.id).length,
                })
              }
              onRenameNote={(note) => setDialog({ type: "rename-note", id: note.id, name: note.title })}
              onDeleteNote={(note) => setDialog({ type: "delete-note", id: note.id, name: note.title })}
            />
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border px-2 py-1.5">
        <p className="text-[11px] text-muted-foreground">Saved in /notes-data</p>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Local files</span>
          <span>{formatBytes(bytes)}</span>
        </div>
        <Progress
          value={Math.min(100, (bytes / (5 * 1024 * 1024)) * 100)}
          className="my-1 w-full gap-0 [&_[data-slot=progress-track]]:h-1 [&_[data-slot=progress-track]]:rounded-none [&_[data-slot=progress-indicator]]:bg-primary"
        />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">Ranganath M D</p>
            <p className="text-[10px] text-primary">Local workspace</p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            className="rounded-none"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </div>

      <NameDialog
        open={dialog?.type === "create-folder"}
        title="Add folder"
        description="Folders are stored as groups inside the local notes-data directory."
        label="Folder name"
        confirmLabel="Create"
        onOpenChange={(open) => !open && setDialog(null)}
        onSubmit={createFolder}
      />
      <NameDialog
        open={dialog?.type === "rename-folder"}
        title="Rename folder"
        description="This updates the folder name in your local workspace."
        label="Folder name"
        initialValue={dialog?.type === "rename-folder" ? dialog.name : ""}
        confirmLabel="Save"
        onOpenChange={(open) => !open && setDialog(null)}
        onSubmit={(name) => {
          if (dialog?.type === "rename-folder") renameFolder(dialog.id, name)
        }}
      />
      <NameDialog
        open={dialog?.type === "rename-note"}
        title="Rename note"
        description="The file title is saved with the note in notes-data/notes."
        label="Note title"
        initialValue={dialog?.type === "rename-note" ? dialog.name : ""}
        confirmLabel="Save"
        onOpenChange={(open) => !open && setDialog(null)}
        onSubmit={(name) => {
          if (dialog?.type === "rename-note") commitNoteTitle(dialog.id, name)
        }}
      />
      <ConfirmDialog
        open={dialog?.type === "delete-folder"}
        title="Delete folder"
        description={
          dialog?.type === "delete-folder"
            ? `Delete “${dialog.name}” and ${dialog.count} note${dialog.count === 1 ? "" : "s"} from disk?`
            : ""
        }
        onOpenChange={(open) => !open && setDialog(null)}
        onConfirm={() => {
          if (dialog?.type === "delete-folder") deleteFolder(dialog.id)
        }}
      />
      <ConfirmDialog
        open={dialog?.type === "delete-note"}
        title="Delete note"
        description={
          dialog?.type === "delete-note" ? `Delete “${dialog.name}” from the local folder?` : ""
        }
        onOpenChange={(open) => !open && setDialog(null)}
        onConfirm={() => {
          if (dialog?.type === "delete-note") deleteNote(dialog.id)
        }}
      />
    </aside>
  )
}

function TreeSection({
  id,
  label,
  icon: Icon,
  open,
  notes,
  selectedId,
  folders,
  onAddNote,
  onRenameFolder,
  onDeleteFolder,
  onRenameNote,
  onDeleteNote,
}: {
  id: string
  label: string
  icon: typeof Folder
  open: boolean
  notes: Note[]
  selectedId: string
  folders: FolderType[]
  onAddNote?: () => void
  onRenameFolder?: () => void
  onDeleteFolder?: () => void
  onRenameNote: (note: Note) => void
  onDeleteNote: (note: Note) => void
}) {
  return (
    <section>
      <div className="group flex h-7 items-center gap-1 px-1 hover:bg-sidebar-accent">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
          onClick={() => toggleFolder(id)}
        >
          <ChevronRight className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-90")} />
          <Icon className="size-3.5" />
          <span className="truncate">{label}</span>
          <span className="text-[10px] font-normal">{notes.length}</span>
        </button>
        {onAddNote || onRenameFolder ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex size-6 items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
              aria-label={`${label} actions`}
            >
              <MoreVertical className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-none">
              {onAddNote ? (
                <DropdownMenuItem onClick={onAddNote}>New note</DropdownMenuItem>
              ) : null}
              {onRenameFolder ? (
                <DropdownMenuItem onClick={onRenameFolder}>Rename folder</DropdownMenuItem>
              ) : null}
              {onDeleteFolder ? (
                <DropdownMenuItem variant="destructive" onClick={onDeleteFolder}>
                  Delete folder
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      {open
        ? notes.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              active={note.id === selectedId}
              folders={folders}
              onRename={() => onRenameNote(note)}
              onDelete={() => onDeleteNote(note)}
            />
          ))
        : null}
    </section>
  )
}

function NoteRow({
  note,
  active,
  folders,
  onRename,
  onDelete,
}: {
  note: Note
  active: boolean
  folders: FolderType[]
  onRename: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        "group flex h-8 items-stretch border-l-2",
        active
          ? "border-l-primary bg-sidebar-accent"
          : "border-l-transparent hover:bg-sidebar-accent/70"
      )}
    >
      <button
        type="button"
        onClick={() => selectNote(note.id)}
        className="flex min-w-0 flex-1 flex-col justify-center px-2 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: note.accent }} />
          <span className="truncate text-sm">{note.title}</span>
        </span>
        <span className="flex items-center justify-between gap-2 pl-3">
          <span className="truncate text-[11px] text-muted-foreground">{formatNoteTime(note.updatedAt)}</span>
          {note.tag ? (
            <Badge className={cn("h-4 rounded-none px-1 text-[10px]", tagClass[note.tag.tone])}>
              {note.tag.label}
            </Badge>
          ) : null}
        </span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex w-7 items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
          aria-label="Note actions"
        >
          <MoreVertical className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="rounded-none" align="end">
          <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
          <DropdownMenuItem onClick={() => togglePinned(note.id)}>
            {note.pinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => duplicateNote(note.id)}>Duplicate</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="rounded-none">
              {folders.map((folder) => (
                <DropdownMenuItem key={folder.id} onClick={() => moveNote(note.id, folder.id)}>
                  {folder.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
