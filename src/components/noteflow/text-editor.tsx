import Placeholder from "@tiptap/extension-placeholder"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useEffect, useState } from "react"

import { Input } from "@/components/ui/input"
import { commitNoteTitle, updateNoteBody, updateNoteTitle } from "@/lib/notes-store"
import type { Note } from "@/lib/types"
import type { Editor } from "@tiptap/react"

function toHtml(body: string) {
  const trimmed = body.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("<")) return body
  return trimmed
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .join("")
}

export function TextEditor({
  note,
  onEditor,
}: {
  note: Note
  onEditor: (editor: Editor | null) => void
}) {
  const approved = note.status === "approved"
  const [title, setTitle] = useState(note.title)

  useEffect(() => {
    setTitle(note.title)
  }, [note.id, note.title])

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: !approved,
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: "Write freely. Switch to Canvas for diagrams.",
        }),
      ],
      content: toHtml(note.body),
      editorProps: {
        attributes: {
          class: "note-editor min-h-full w-full max-w-[600px] px-2 py-2 text-[15px] leading-6 outline-none",
        },
      },
      onUpdate: ({ editor: next }) => {
        updateNoteBody(note.id, next.getHTML())
      },
    },
    [note.id]
  )

  useEffect(() => {
    onEditor(editor)
    return () => onEditor(null)
  }, [editor, onEditor])

  useEffect(() => {
    editor?.setEditable(!approved)
  }, [approved, editor])

  useEffect(() => {
    if (!editor) return
    const next = toHtml(note.body)
    if (editor.getHTML() === next) return
    editor.commands.setContent(next, { emitUpdate: false })
  }, [editor, note.body])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-10 shrink-0 items-center border-b border-border">
        <Input
          value={title}
          readOnly={approved}
          onChange={(event) => {
            const next = event.target.value
            setTitle(next)
            updateNoteTitle(note.id, next)
          }}
          onBlur={() => commitNoteTitle(note.id, title)}
          onKeyDown={(event) => event.stopPropagation()}
          className="mx-auto h-10 w-full max-w-[600px] rounded-none border-0 bg-transparent px-2 text-xl font-semibold shadow-none focus-visible:ring-0"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <EditorContent editor={editor} className="mx-auto w-full max-w-[600px]" />
      </div>
    </div>
  )
}
