import { Sparkles } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { generateNoteFn } from "@/lib/gemini-note"
import { appendNoteBody } from "@/lib/notes-store"
import type { Note } from "@/lib/types"

export function AiPanel({ note }: { note: Note | undefined }) {
  const [instruction, setInstruction] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const approved = note?.status === "approved"
  const hasPrompt = instruction.trim().length > 0
  const canGenerate = Boolean(note) && !approved && !busy && hasPrompt

  async function generate() {
    if (!note) return
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      const result = await generateNoteFn({
        data: {
          instruction,
          existingBody: note.body,
        },
      })
      if (!result?.html) {
        throw new Error("Gemini returned no text. Check GEMINI_API_KEY and try again.")
      }
      appendNoteBody(note.id, result.html)
      setDone("Appended to this note.")
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : typeof cause === "object" &&
              cause &&
              "message" in cause &&
              typeof cause.message === "string"
            ? cause.message
            : "Gemini request failed."
      setError(message || "Gemini request failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border px-3">
        <Sparkles className="size-3.5 text-muted-foreground" />
        <h2 className="text-xs font-semibold tracking-wide">AI</h2>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <p className="text-xs leading-5 text-muted-foreground">
          {approved
            ? "This note is approved. Re-edit it to use AI."
            : "Type a prompt. Gemini will append to this note’s text."}
        </p>

        <Textarea
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          disabled={!note || approved}
          rows={5}
          placeholder="Write a meeting recap, outline next steps, expand this note…"
          className="min-h-0 flex-none resize-y field-sizing-fixed"
        />

        <Button
          type="button"
          disabled={!canGenerate}
          onClick={() => void generate()}
          className="w-full"
        >
          {busy ? "Writing…" : "Write note"}
        </Button>

        {error ? <p className="text-xs leading-5 text-destructive">{error}</p> : null}
        {done ? <p className="text-xs leading-5 text-emerald-600 dark:text-emerald-400">{done}</p> : null}
      </div>
    </aside>
  )
}
