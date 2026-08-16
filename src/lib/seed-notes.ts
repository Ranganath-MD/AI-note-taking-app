import type { Folder, Note, Workspace } from "@/lib/types"

const now = Date.now()

export const seedFolders: Folder[] = [
  { id: "work", name: "Work" },
  { id: "personal", name: "Personal" },
  { id: "archive", name: "Archive" },
]

export const seedNotes: Note[] = [
  {
    id: "note-q3-architecture",
    title: "Q3 Product Architecture",
    body: `Meeting dump — architecture diagram

- API Gateway is the public entry. Need to confirm failover.
- Whiteboard Sync owns live canvas ops and presence.
- Redis Store holds ephemeral scene state.

Need to test sync latency on slow connections. Threshold: < 120ms.
AI Coprocessor translates vector paths to text for summaries.

TODO: Check backup policy!`,
    snippet:
      "Flowchart detailing the split between core engine microservices and the whiteboard sync layers...",
    folderId: "work",
    pinned: true,
    tag: { label: "urgent", tone: "urgent" },
    accent: "#ef4444",
    updatedAt: now - 18 * 60_000,
    viewMode: "canvas",
    status: "draft",
    canvas: null,
    versions: [],
  },
  {
    id: "note-saas-growth",
    title: "SaaS Growth Strategies",
    body: `Key monetization hooks:
1. Multiplayer real-time whiteboards
2. AI-driven document synthesizers
3. Team workspaces with guest sharing

Pricing experiment: Pro vs Team seat model.`,
    snippet:
      "Key monetization hooks: 1. Multiplayer real-time whiteboards 2. AI-driven document synthesizers...",
    folderId: "work",
    pinned: true,
    tag: { label: "idea", tone: "idea" },
    accent: "#60a5fa",
    updatedAt: now - 26 * 60 * 60_000,
    viewMode: "text",
    status: "approved",
    canvas: null,
    versions: [],
  },
  {
    id: "note-standup",
    title: "Monday standup notes",
    body: `Raw notes
- Sync latency still flaky on 3G
- Design wants canvas/text toggle in toolbar
- Legal review for share links next week`,
    snippet: "Raw notes — Sync latency still flaky on 3G, design wants canvas/text toggle...",
    folderId: "work",
    pinned: false,
    tag: { label: "meeting", tone: "meeting" },
    accent: "#10b981",
    updatedAt: now - 3 * 24 * 60 * 60_000,
    viewMode: "text",
    status: "draft",
    canvas: null,
    versions: [],
  },
  {
    id: "note-reading-list",
    title: "Weekend reading list",
    body: `- Excalidraw embedding docs
- CRDT vs OT for whiteboards
- Local-first storage patterns`,
    snippet: "Excalidraw embedding docs, CRDT vs OT for whiteboards, local-first storage...",
    folderId: "personal",
    pinned: false,
    tag: { label: "personal", tone: "personal" },
    accent: "#f59e0b",
    updatedAt: now - 5 * 24 * 60 * 60_000,
    viewMode: "text",
    status: "draft",
    canvas: null,
    versions: [],
  },
]

export const seedWorkspace: Workspace = {
  folders: seedFolders,
  notes: seedNotes,
  selectedId: seedNotes[0]?.id ?? "",
  theme: "dark",
  expanded: {
    pinned: true,
    work: true,
    personal: true,
    archive: false,
  },
}
