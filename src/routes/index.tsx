import { createFileRoute } from "@tanstack/react-router"

import { NoteFlowApp } from "@/components/noteflow/app-shell"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return <NoteFlowApp />
}
