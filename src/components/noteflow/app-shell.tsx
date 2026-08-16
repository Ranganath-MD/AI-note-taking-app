import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useSelector } from "@tanstack/react-store"
import { useEffect, useState } from "react"

import { AiPanel } from "@/components/noteflow/ai-panel"
import { EditorArea } from "@/components/noteflow/editor-area"
import { AppSidebar } from "@/components/noteflow/sidebar"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { TooltipProvider } from "@/components/ui/tooltip"
import { createNote, hydrateNotes, notesStore, selectedNote } from "@/lib/notes-store"

export function NoteFlowApp() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NoteFlowShell />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

function NoteFlowShell() {
  const [ready, setReady] = useState(false)
  const note = useSelector(notesStore, selectedNote)
  const theme = useSelector(notesStore, (state) => state.theme)

  useEffect(() => {
    void hydrateNotes().then(() => setReady(true))
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey
      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault()
        document.getElementById("note-search")?.focus()
      }
      if (meta && event.key.toLowerCase() === "n") {
        event.preventDefault()
        createNote()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  if (!ready) {
    return <div className="h-svh bg-background" />
  }

  return (
    <div
      className="flex h-svh overflow-hidden bg-background text-foreground"
      data-theme={theme}
    >
      <AppSidebar />
      <ResizablePanelGroup
        id="editor-ai"
        orientation="horizontal"
        className="min-h-0 min-w-0 flex-1 overflow-hidden"
      >
        <ResizablePanel id="editor" minSize="40%" defaultSize="74%" className="min-h-0 min-w-0 overflow-hidden">
          <div className="h-full min-h-0 overflow-hidden">
            <EditorArea note={note} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel id="ai" minSize="16%" maxSize="42%" defaultSize="26%" className="min-h-0 min-w-0">
          <div className="h-full min-h-0">
            <AiPanel note={note} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
