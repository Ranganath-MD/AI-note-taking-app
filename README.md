# NoteFlow

Local-first notes: TipTap text, Excalidraw canvas, Gemini in the right panel. Everything is JSON under [`notes-data/`](notes-data/README.md) — no remote database.

**Storage, schemas, seed, Git, and AI env:** see **[notes-data/README.md](notes-data/README.md)** (canonical).

## Stack

TanStack Start, Router, Query, Store · Tailwind v4 · shadcn/ui (Base UI) · TipTap · Excalidraw · Gemini API

## Develop

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
# optional AI
# .env (gitignored)
VITE_GEMINI_API_KEY=...
VITE_GEMINI_MODEL=gemini-3.5-flash
```

- `⌘K` search · `⌘N` new note
- Folders and notes: create, rename, pin, duplicate, move, delete
- Theme toggle: app + canvas
- Text / Canvas are two fields on the same note
- AI appends to the text body from a prompt (canvas is not sent to the model)
