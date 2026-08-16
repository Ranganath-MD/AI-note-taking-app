import type { Editor } from "@tiptap/react"
import { useEditorState } from "@tiptap/react"
import {
  Bold,
  Check,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Pencil,
  Quote,
  Strikethrough,
} from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { setNoteStatus, setViewMode } from "@/lib/notes-store"
import type { Note } from "@/lib/types"
import { cn } from "@/lib/utils"

type ToolbarProps = {
  note: Note
  editor: Editor | null
}

export function NoteToolbar({ note, editor }: ToolbarProps) {
  const approved = note.status === "approved"
  const textMode = note.viewMode === "text"
  const marks = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor?.isActive("bold") ?? false,
      italic: ctx.editor?.isActive("italic") ?? false,
      strike: ctx.editor?.isActive("strike") ?? false,
      h1: ctx.editor?.isActive("heading", { level: 1 }) ?? false,
      h2: ctx.editor?.isActive("heading", { level: 2 }) ?? false,
      bullet: ctx.editor?.isActive("bulletList") ?? false,
      ordered: ctx.editor?.isActive("orderedList") ?? false,
      quote: ctx.editor?.isActive("blockquote") ?? false,
    }),
  })

  return (
    <div className="flex h-8 shrink-0 items-center border-b border-border">
      <div className="flex h-full">
        {(["text", "canvas"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={note.viewMode === mode}
            onClick={() => setViewMode(note.id, mode)}
            className={cn(
              "h-full min-w-14 px-2 text-xs capitalize",
              note.viewMode === mode
                ? "bg-secondary font-semibold text-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            {mode === "canvas" ? "Canvas" : "Text"}
          </button>
        ))}
      </div>

      <span className="mx-1 h-full w-px bg-border" />

      {textMode ? (
        <div className="flex h-full items-center">
          <FormatButton
            label="Bold"
            pressed={marks?.bold ?? false}
            disabled={!editor || approved}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold />
          </FormatButton>
          <FormatButton
            label="Italic"
            pressed={marks?.italic ?? false}
            disabled={!editor || approved}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic />
          </FormatButton>
          <FormatButton
            label="Strikethrough"
            pressed={marks?.strike ?? false}
            disabled={!editor || approved}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          >
            <Strikethrough />
          </FormatButton>
          <FormatButton
            label="Heading 1"
            pressed={marks?.h1 ?? false}
            disabled={!editor || approved}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 />
          </FormatButton>
          <FormatButton
            label="Heading 2"
            pressed={marks?.h2 ?? false}
            disabled={!editor || approved}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 />
          </FormatButton>
          <FormatButton
            label="Bullet list"
            pressed={marks?.bullet ?? false}
            disabled={!editor || approved}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List />
          </FormatButton>
          <FormatButton
            label="Numbered list"
            pressed={marks?.ordered ?? false}
            disabled={!editor || approved}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered />
          </FormatButton>
          <FormatButton
            label="Quote"
            pressed={marks?.quote ?? false}
            disabled={!editor || approved}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <Quote />
          </FormatButton>
        </div>
      ) : null}

      <div className="ml-auto flex h-full items-center">
        <Button
          variant={approved ? "outline" : "default"}
          size="icon-xs"
          className="h-8 w-8 rounded-none"
          aria-label={approved ? "Re-edit notes" : "Approve notes"}
          title={approved ? "Re-edit" : "Approve"}
          onClick={() => setNoteStatus(note.id, approved ? "draft" : "approved")}
        >
          {approved ? <Pencil /> : <Check />}
        </Button>
      </div>
    </div>
  )
}

function FormatButton({
  label,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string
  pressed: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn("h-8 w-8 rounded-none", pressed && "bg-muted text-foreground")}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
