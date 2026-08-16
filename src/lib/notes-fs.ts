import { createServerFn } from "@tanstack/react-start"
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import path from "node:path"

import { seedWorkspace } from "@/lib/seed-notes"
import type { Folder, Note, Workspace } from "@/lib/types"

const ROOT = path.join(process.cwd(), "notes-data")
const NOTES_DIR = path.join(ROOT, "notes")
const WORKSPACE_FILE = path.join(ROOT, "workspace.json")

function assertId(id: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error("Invalid identifier")
  }
  return id
}

async function ensureDirs() {
  await mkdir(NOTES_DIR, { recursive: true })
}

async function directorySize(dir: string): Promise<number> {
  const entries = await readdir(dir, { withFileTypes: true })
  let total = 0
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      total += await directorySize(full)
    } else {
      total += (await stat(full)).size
    }
  }
  return total
}

async function writeWorkspaceFiles(workspace: Workspace) {
  await ensureDirs()
  const { notes, ...meta } = workspace
  await writeFile(
    WORKSPACE_FILE,
    JSON.stringify({ ...meta, noteIds: notes.map((note) => note.id) }, null, 2),
    "utf8"
  )

  const existing = await readdir(NOTES_DIR)
  const keep = new Set(notes.map((note) => `${note.id}.json`))
  await Promise.all(
    existing
      .filter((file) => file.endsWith(".json") && !keep.has(file))
      .map((file) => rm(path.join(NOTES_DIR, file), { force: true }))
  )

  await Promise.all(
    notes.map((note) =>
      writeFile(path.join(NOTES_DIR, `${assertId(note.id)}.json`), JSON.stringify(note, null, 2), "utf8")
    )
  )
}

async function readWorkspaceFromDisk(): Promise<Workspace & { bytes: number }> {
  await ensureDirs()
  try {
    const raw = await readFile(WORKSPACE_FILE, "utf8")
    const meta = JSON.parse(raw) as Omit<Workspace, "notes"> & { noteIds?: string[] }
    const files = await readdir(NOTES_DIR)
    const notes: Note[] = []
    for (const file of files) {
      if (!file.endsWith(".json")) continue
      const note = JSON.parse(await readFile(path.join(NOTES_DIR, file), "utf8")) as Note
      notes.push(note)
    }
    notes.sort((a, b) => b.updatedAt - a.updatedAt)
    const folders: Folder[] = meta.folders?.length ? meta.folders : seedWorkspace.folders
    const workspace: Workspace = {
      folders,
      notes,
      selectedId: meta.selectedId || notes[0]?.id || "",
      theme: meta.theme === "light" ? "light" : "dark",
      expanded: meta.expanded ?? seedWorkspace.expanded,
    }
    return { ...workspace, bytes: await directorySize(ROOT) }
  } catch {
    await writeWorkspaceFiles(seedWorkspace)
    return { ...seedWorkspace, bytes: await directorySize(ROOT) }
  }
}

export const loadWorkspaceFn = createServerFn({ method: "GET", strict: false }).handler(async () => {
  return readWorkspaceFromDisk()
})

export const saveWorkspaceFn = createServerFn({ method: "POST", strict: false })
  .validator((data: Workspace) => data)
  .handler(async ({ data }) => {
    await writeWorkspaceFiles(data)
    return { bytes: await directorySize(ROOT) }
  })
