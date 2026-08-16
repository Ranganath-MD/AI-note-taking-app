import { Excalidraw, serializeAsJSON } from "@excalidraw/excalidraw"
import type { AppState, BinaryFiles, ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types"
import { memo, useCallback, useEffect, useMemo, useRef } from "react"

import { notesStore, saveCanvas, setCanvasStats, setLiveCanvas } from "@/lib/notes-store"
import type { CanvasScene, Theme } from "@/lib/types"

import "@excalidraw/excalidraw/index.css"

const UI_OPTIONS = {
  canvasActions: {
    toggleTheme: false,
  },
} as const

type BoardProps = {
  noteId: string
  theme: Theme
}

function ExcalidrawBoard({ noteId, theme }: BoardProps) {
  const noteIdRef = useRef(noteId)
  noteIdRef.current = noteId

  useEffect(() => {
    lastPayload = ""
  }, [noteId])

  const initialData = useMemo((): ExcalidrawInitialDataState => {
    const note = notesStore.get().notes.find((item) => item.id === noteId)
    const elements = note?.canvas?.elements ?? []

    return {
      elements: elements as ExcalidrawInitialDataState["elements"],
      appState: {
        viewBackgroundColor: theme === "dark" ? "#121215" : "#ffffff",
        gridSize: 20,
        currentItemStrokeColor: "#6366f1",
        ...(note?.canvas?.appState ?? {}),
      },
      files: (note?.canvas?.files ?? {}) as ExcalidrawInitialDataState["files"],
    }
  }, [noteId, theme])

  const onChange = useCallback(
    (
      elements: readonly unknown[],
      appState: AppState,
      files: BinaryFiles
    ) => {
      setCanvasStats(
        Math.round((appState.zoom?.value ?? 1) * 100),
        elements.filter((element) => !(element as { isDeleted?: boolean }).isDeleted).length
      )
      setLiveCanvas(noteIdRef.current, elements)
      persistScene(noteIdRef.current, elements, appState, files)
    },
    []
  )

  return (
    <div className="h-full min-h-0 w-full overflow-hidden [&_.excalidraw]:h-full [&_.excalidraw]:w-full">
      <Excalidraw
        key={`${noteId}-${theme}`}
        theme={theme}
        initialData={initialData}
        UIOptions={UI_OPTIONS}
        onChange={onChange}
      />
    </div>
  )
}

export default memo(ExcalidrawBoard)

let persistHandle: number | undefined
let lastPayload = ""

function persistScene(
  noteId: string,
  elements: readonly unknown[],
  appState: AppState,
  files: BinaryFiles
) {
  window.clearTimeout(persistHandle)
  persistHandle = window.setTimeout(() => {
    const serialized = serializeAsJSON(elements as never, appState, files, "database")
    if (serialized === lastPayload) return
    lastPayload = serialized
    saveCanvas(noteId, JSON.parse(serialized) as CanvasScene)
  }, 400)
}
