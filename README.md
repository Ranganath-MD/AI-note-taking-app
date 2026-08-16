# NoteFlow data store (`notes-data/`)

This directory is NoteFlow’s **global local database**. The app does not use Postgres, SQLite, or a cloud backend. Every folder, note, canvas, theme choice, and version snapshot is JSON on disk here.

<img width="1914" height="1097" alt="Screenshot 2026-08-16 at 9 47 10 PM" src="https://github.com/user-attachments/assets/3b50f68a-aa10-4c21-acc8-2f009514865c" />


This README is the canonical reference for:

- how to run the app so this directory is created
- what each file contains
- how saves, seed data, Git, and AI writes interact with it

Implementation: [`src/lib/notes-fs.ts`](../src/lib/notes-fs.ts), [`src/lib/notes-store.ts`](../src/lib/notes-store.ts), [`src/lib/types.ts`](../src/lib/types.ts), [`src/lib/seed-notes.ts`](../src/lib/seed-notes.ts).

---

## Run the app

From the project root:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

On first launch (no valid `workspace.json`), NoteFlow writes a **seed workspace** into this folder (sample folders `Work`, `Personal`, `Archive` and a few notes). After that, all edits persist here.

### Useful commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` / `pnpm preview` | Production build |
| `pnpm typecheck` | TypeScript |
| `pnpm lint` / `pnpm format` | Lint / Prettier |

### Shortcuts (app)

| Shortcut | Action |
| --- | --- |
| `⌘K` / `Ctrl+K` | Focus note search |
| `⌘N` / `Ctrl+N` | New note in the current folder |

### Sidebar

- **New folder** — create; overflow menu: rename, delete (deletes the folder’s notes from disk too)
- **Note overflow** — rename, pin, duplicate, move, delete
- **Theme** — light/dark on `html` and Excalidraw; stored as `workspace.json` → `theme`

### Editor

- **Text** — TipTap HTML in `body` (reading column max 600px; only the body scrolls)
- **Canvas** — Excalidraw; blank until you draw; stored in `canvas`
- **Approve** — snapshots `title` + `body` into `versions` (not canvas) and locks the text editor
- Header: pin, version history restore

### AI panel (right rail)

- Prompt-only: Gemini appends HTML to `body` under an “From AI” heading
- Canvas is **not** sent to the model
- Requires `.env` (see below). The editor/AI split is resizable

---

## Git

The repo `.gitignore` is:

```
notes-data/*
!notes-data/README.md
```

`workspace.json` and `notes/*.json` are **local only**. This README is the only tracked file in `notes-data/`. Back up the JSON yourself if you need it on another machine.

---

## Layout

```
notes-data/
  README.md                 # this file (tracked)
  workspace.json            # folders, theme, selection, note id list
  notes/
    <note-id>.json          # one file per note (full document)
```

Root path is always `{process.cwd()}/notes-data` (the project root when you run `pnpm dev`).

Note filenames must be `{id}.json` where `id` matches `^[a-zA-Z0-9_-]+$` (the app uses UUIDs).

---

## Persistence

1. UI updates TanStack Store (`notesStore`).
2. A **~300ms** debounce writes the whole workspace via `saveWorkspaceFn`.
3. Excalidraw `onChange` waits **~400ms**, `serializeAsJSON(..., "database")`, then `saveCanvas` (which also triggers the workspace persist).
4. Writer (`writeWorkspaceFiles`):
   - updates `workspace.json` (`folders`, `selectedId`, `theme`, `expanded`, `noteIds`)
   - writes every `notes/<id>.json`
   - **deletes** any `notes/*.json` whose id is not in the current workspace

If `workspace.json` is missing or JSON parse/read fails, the app **reseeds** from `seed-notes.ts` and overwrites this directory. Do not leave a corrupt `workspace.json` if you care about existing notes.

Saves are not transactional. Avoid hand-editing files while the app is running, or the next debounce will overwrite you.

---

## `workspace.json`

Example shape:

```json
{
  "folders": [{ "id": "work", "name": "Work" }],
  "selectedId": "<note-uuid>",
  "theme": "light",
  "expanded": { "pinned": true, "work": true },
  "noteIds": ["<note-uuid>"]
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `folders` | `{ id, name }[]` | Sidebar folders |
| `selectedId` | `string` | Open note; falls back to newest note if empty |
| `theme` | `"light"` \| `"dark"` | App + canvas theme |
| `expanded` | `Record<string, boolean>` | Folder / section open state (`pinned`, folder ids, …) |
| `noteIds` | `string[]` | Ids written at last save (load still scans `notes/` and sorts by `updatedAt` desc) |

Note **bodies are not** in this file.

---

## `notes/<id>.json`

One object per note (`Note` in `src/lib/types.ts`).

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | `string` | Must match the filename |
| `title` | `string` | Title field |
| `body` | `string` | TipTap HTML (may start as plain text on seed notes) |
| `snippet` | `string` | Sidebar preview (stripped HTML, truncated) |
| `folderId` | `string` | Must match a folder `id` |
| `pinned` | `boolean` | Pinned list |
| `tag` | `{ label, tone } \| null` | `tone`: `urgent` \| `idea` \| `meeting` \| `personal` |
| `accent` | `string` | Hex color |
| `updatedAt` | `number` | Unix milliseconds |
| `viewMode` | `"text"` \| `"canvas"` | Which pane is showing |
| `status` | `"draft"` \| `"approved"` | Approved → text editor read-only |
| `canvas` | `CanvasScene \| null` | Excalidraw export (`elements`, `appState`, `files`, plus Excalidraw metadata) |
| `versions` | `{ id, createdAt, title, body }[]` | Capped (20). Restore copies title/body only |

Text and canvas are **two fields on the same note**, not two note types. Switching Text/Canvas does not delete the other field.

New notes start as `viewMode: "text"`, `canvas: null`, empty body.

---

## Seed data

Defined in `src/lib/seed-notes.ts`. Used only when this directory has no readable workspace. After that, your JSON is the source of truth.

To **reset** to seed:

1. Stop `pnpm dev`
2. Delete `workspace.json` and everything in `notes/` except you cannot delete this README
3. Start the app again

---

## AI writes

Gemini is called from a TanStack server function (`src/lib/gemini-note.ts`). It **appends** to `body` (then the normal persist path writes `notes/<id>.json`).

Create `.env` in the **project root** (gitignored via `.env*`):

```bash
VITE_GEMINI_API_KEY=your_ai_studio_key
VITE_GEMINI_MODEL=gemini-3.5-flash
```

- Get a key at [Google AI Studio](https://aistudio.google.com/apikey). New keys often start with `AQ.`
- Vite only inlines `VITE_*` names (`import.meta.env.VITE_GEMINI_API_KEY`)
- Restart `pnpm dev` after changing `.env`
- `gemini-2.5-flash` returns 404 for new projects; use `gemini-3.5-flash` (app also falls back to `3.6` / `3.7`)
- Do not log the key in the client; `VITE_` values can appear in the client bundle

Approved notes cannot be written by AI until you re-edit (draft).

---

## Backup and hand edits

- Copy `workspace.json` + `notes/` to back up
- Keep `id` in the JSON equal to the filename
- After adding a note file by hand, add its id to `workspace.json` → `noteIds` and a matching `folderId` (load still picks up any `notes/*.json`, but the next save rewrites `noteIds` from the in-memory list)
- Orphan files in `notes/` are removed on the next successful save if they are not in the live workspace

---

