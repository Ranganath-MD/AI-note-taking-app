# notes-data

Local JSON store for NoteFlow. The app reads and writes this directory on disk — there is no remote database.

Git ignores everything here except this README (see the repo `.gitignore`). Your notes stay on the machine that runs `pnpm dev`.

## Layout

```
notes-data/
  README.md              # this file (tracked)
  workspace.json         # folders, theme, selection, note id list
  notes/
    <note-id>.json       # one file per note
```

The folder is created on first launch. If `workspace.json` is missing or unreadable, the app seeds a default workspace and writes it here.

## How it is written

- Path is always `{project root}/notes-data` (`process.cwd()`).
- Saves are debounced from the client (~300ms after store changes).
- Canvas edits are serialized separately (~400ms) then merged into the note file.
- `workspace.json` does **not** embed note bodies. It lists `noteIds`; each note lives in `notes/<id>.json`.
- On save, note files that are no longer in the workspace are deleted.

Note ids must match `[a-zA-Z0-9_-]+` (UUIDs from the app are valid).

## `workspace.json`

| Field | Meaning |
| --- | --- |
| `folders` | `{ id, name }` list shown in the sidebar |
| `selectedId` | Note currently open in the editor |
| `theme` | `"light"` or `"dark"` |
| `expanded` | Sidebar section / folder open state (`id → boolean`) |
| `noteIds` | Order hint; load order on disk is actually newest `updatedAt` first |

## `notes/<id>.json`

Each file is a full note:

| Field | Meaning |
| --- | --- |
| `id` | Same as the filename (without `.json`) |
| `title` | Note title |
| `body` | TipTap HTML |
| `snippet` | Plain-text preview for the sidebar |
| `folderId` | Parent folder id |
| `pinned` | Sidebar pin |
| `tag` | Optional `{ label, tone }` or `null` |
| `accent` | Color string |
| `updatedAt` | Unix ms |
| `viewMode` | `"text"` or `"canvas"` |
| `status` | `"draft"` or `"approved"` |
| `canvas` | Excalidraw scene (`elements`, `appState`, `files`) or `null` |
| `versions` | Snapshots of `title` + `body` (approve). Canvas is not versioned |

## Editing by hand

You can inspect or back up these files. Prefer quitting the app (or waiting for a save) before editing, or the next debounce will overwrite you.

To reset to seed data, stop the app and delete `workspace.json` and `notes/*.json`, then start again.
