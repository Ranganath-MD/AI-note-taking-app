export type ViewMode = "canvas" | "text"

export type NoteStatus = "draft" | "approved"

export type NoteTag = {
  label: string
  tone: "urgent" | "idea" | "meeting" | "personal"
}

export type NoteVersion = {
  id: string
  createdAt: number
  title: string
  body: string
}

export type CanvasScene = {
  elements: unknown[]
  appState: Record<string, unknown>
  files: Record<string, unknown>
}

export type Folder = {
  id: string
  name: string
}

export type Note = {
  id: string
  title: string
  body: string
  snippet: string
  folderId: string
  pinned: boolean
  tag: NoteTag | null
  accent: string
  updatedAt: number
  viewMode: ViewMode
  status: NoteStatus
  canvas: CanvasScene | null
  versions: NoteVersion[]
}

export type Theme = "dark" | "light"

export type Workspace = {
  folders: Folder[]
  notes: Note[]
  selectedId: string
  theme: Theme
  expanded: Record<string, boolean>
}
