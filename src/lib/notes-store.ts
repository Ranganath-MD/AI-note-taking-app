import { Store } from "@tanstack/store"

import { summarizeCanvas, type CompactCanvasElement } from "@/lib/canvas-summary"
import { snippetFromBody } from "@/lib/format"
import { loadWorkspaceFn, saveWorkspaceFn } from "@/lib/notes-fs"
import { seedWorkspace } from "@/lib/seed-notes"
import type { CanvasScene, Folder, Note, NoteStatus, Theme, ViewMode, Workspace } from "@/lib/types"

export type NotesState = Workspace & {
  search: string
  bytes: number
}

const defaultState: NotesState = {
  ...seedWorkspace,
  search: "",
  bytes: 0,
}

export const notesStore = new Store<NotesState>(defaultState)

let hydrated = false
let persistTimer: number | undefined

export async function hydrateNotes() {
  const data = await loadWorkspaceFn()
  notesStore.setState((state) => ({
    ...state,
    ...data,
    search: "",
  }))
  hydrated = true
  applyTheme(data.theme)
}

function persist() {
  if (!hydrated) return
  window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(() => {
    const payload = JSON.stringify({
      folders: notesStore.state.folders,
      notes: notesStore.state.notes,
      selectedId: notesStore.state.selectedId,
      theme: notesStore.state.theme,
      expanded: notesStore.state.expanded,
    })
    if (payload === lastSaved) return
    lastSaved = payload
    void saveWorkspaceFn({
      data: {
        folders: notesStore.state.folders,
        notes: notesStore.state.notes,
        selectedId: notesStore.state.selectedId,
        theme: notesStore.state.theme,
        expanded: notesStore.state.expanded,
      },
    }).then((result) => {
      notesStore.setState((state) => ({ ...state, bytes: result.bytes }))
    })
  }, 300)
}

let lastSaved = ""

notesStore.subscribe(() => persist())

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.classList.toggle("light", theme === "light")
}

function patchState(updater: (state: NotesState) => NotesState) {
  notesStore.setState(updater)
}

export function selectNote(id: string) {
  patchState((state) => ({ ...state, selectedId: id }))
}

export function setSearch(search: string) {
  patchState((state) => ({ ...state, search }))
}

export function toggleFolder(folderId: string) {
  patchState((state) => ({
    ...state,
    expanded: { ...state.expanded, [folderId]: !state.expanded[folderId] },
  }))
}

export function setTheme(theme: Theme) {
  applyTheme(theme)
  patchState((state) => ({ ...state, theme }))
}

export function createFolder(name: string) {
  const folder: Folder = {
    id: crypto.randomUUID(),
    name: name.trim() || "Untitled folder",
  }
  patchState((state) => ({
    ...state,
    folders: [...state.folders, folder],
    expanded: { ...state.expanded, [folder.id]: true },
  }))
  return folder.id
}

export function renameFolder(id: string, name: string) {
  const next = name.trim()
  if (!next) return
  patchState((state) => ({
    ...state,
    folders: state.folders.map((folder) => (folder.id === id ? { ...folder, name: next } : folder)),
  }))
}

export function deleteFolder(id: string) {
  patchState((state) => {
    const remainingNotes = state.notes.filter((note) => note.folderId !== id)
    return {
      ...state,
      folders: state.folders.filter((folder) => folder.id !== id),
      notes: remainingNotes,
      selectedId:
        remainingNotes.some((note) => note.id === state.selectedId)
          ? state.selectedId
          : remainingNotes[0]?.id ?? "",
    }
  })
}

export function createNote(folderId?: string) {
  const id = crypto.randomUUID()
  patchState((state) => {
    const targetFolder = folderId ?? state.folders[0]?.id
    if (!targetFolder) return state
    const note: Note = {
      id,
      title: "Untitled note",
      body: "",
      snippet: "Empty note",
      folderId: targetFolder,
      pinned: false,
      tag: null,
      accent: "#6366f1",
      updatedAt: Date.now(),
      viewMode: "text",
      status: "draft",
      canvas: null,
      versions: [],
    }
    return {
      ...state,
      selectedId: id,
      expanded: { ...state.expanded, [targetFolder]: true },
      notes: [note, ...state.notes],
    }
  })
  return id
}

export function duplicateNote(id: string) {
  const source = notesStore.get().notes.find((note) => note.id === id)
  if (!source) return
  const copyId = crypto.randomUUID()
  patchState((state) => ({
    ...state,
    selectedId: copyId,
    notes: [
      {
        ...source,
        id: copyId,
        title: `${source.title} copy`,
        updatedAt: Date.now(),
      },
      ...state.notes,
    ],
  }))
}

export function deleteNote(id: string) {
  patchState((state) => {
    const notes = state.notes.filter((note) => note.id !== id)
    return {
      ...state,
      notes,
      selectedId: state.selectedId === id ? notes[0]?.id ?? "" : state.selectedId,
    }
  })
}

export function moveNote(id: string, folderId: string) {
  patchState((state) => ({
    ...state,
    expanded: { ...state.expanded, [folderId]: true },
    notes: state.notes.map((note) =>
      note.id === id ? { ...note, folderId, updatedAt: Date.now() } : note
    ),
  }))
}

function updateNote(id: string, patch: Partial<Note>) {
  patchState((state) => ({
    ...state,
    notes: state.notes.map((note) =>
      note.id === id ? { ...note, ...patch, updatedAt: Date.now() } : note
    ),
  }))
}

export function updateNoteTitle(id: string, title: string) {
  updateNote(id, { title })
}

export function commitNoteTitle(id: string, title: string) {
  updateNote(id, { title: title.trim() || "Untitled note" })
}

export function updateNoteBody(id: string, body: string) {
  updateNote(id, { body, snippet: snippetFromBody(body) || "Empty note" })
}

export function appendNoteBody(id: string, html: string) {
  const note = notesStore.get().notes.find((item) => item.id === id)
  if (!note) return
  const addition = html.trim()
  if (!addition) return
  const block = `<h2>From AI</h2>${addition}`
  const body = note.body.trim() ? `${note.body}<hr/>${block}` : block
  updateNoteBody(id, body)
}

export function setViewMode(id: string, viewMode: ViewMode) {
  updateNote(id, { viewMode })
}

export function togglePinned(id: string) {
  patchState((state) => ({
    ...state,
    notes: state.notes.map((note) =>
      note.id === id ? { ...note, pinned: !note.pinned, updatedAt: Date.now() } : note
    ),
  }))
}

export function saveCanvas(id: string, canvas: CanvasScene) {
  patchState((state) => ({
    ...state,
    notes: state.notes.map((note) =>
      note.id === id ? { ...note, canvas, updatedAt: Date.now() } : note
    ),
  }))
}

export const canvasStatsStore = new Store({ zoom: 100, elements: 0 })

export const liveCanvasStore = new Store<{
  noteId: string
  elements: CompactCanvasElement[]
}>({ noteId: "", elements: [] })

export function setLiveCanvas(noteId: string, elements: readonly unknown[]) {
  liveCanvasStore.setState(() => ({
    noteId,
    elements: summarizeCanvas(elements),
  }))
}

export function setCanvasStats(zoom: number, elements: number) {
  const current = canvasStatsStore.get()
  if (current.zoom === zoom && current.elements === elements) return
  canvasStatsStore.setState(() => ({ zoom, elements }))
}

export function snapshotVersion(id: string) {
  patchState((state) => ({
    ...state,
    notes: state.notes.map((note) => {
      if (note.id !== id) return note
      return {
        ...note,
        versions: [
          {
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            title: note.title,
            body: note.body,
          },
          ...note.versions,
        ].slice(0, 20),
      }
    }),
  }))
}

export function restoreVersion(noteId: string, versionId: string) {
  patchState((state) => ({
    ...state,
    notes: state.notes.map((note) => {
      if (note.id !== noteId) return note
      const version = note.versions.find((item) => item.id === versionId)
      if (!version) return note
      return {
        ...note,
        title: version.title,
        body: version.body,
        snippet: snippetFromBody(version.body),
        status: "draft",
        updatedAt: Date.now(),
      }
    }),
  }))
}

export function setNoteStatus(id: string, status: NoteStatus) {
  if (status === "approved") snapshotVersion(id)
  updateNote(id, { status })
}

export function selectedNote(state: NotesState) {
  return state.notes.find((note) => note.id === state.selectedId) ?? state.notes[0]
}

export function folderById(state: NotesState, id: string) {
  return state.folders.find((folder) => folder.id === id)
}
