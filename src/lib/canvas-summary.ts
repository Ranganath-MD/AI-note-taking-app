export type CompactCanvasElement = {
  id: string
  type: string
  text?: string
  x?: number
  y?: number
  containerId?: string
  start?: string
  end?: string
}

type RawElement = {
  id?: string
  type?: string
  isDeleted?: boolean
  text?: string
  originalText?: string
  x?: number
  y?: number
  containerId?: string | null
  startBinding?: { elementId?: string } | null
  endBinding?: { elementId?: string } | null
}

export function summarizeCanvas(elements: readonly unknown[]): CompactCanvasElement[] {
  const compact: CompactCanvasElement[] = []
  for (const item of elements) {
    const element = item as RawElement
    if (!element.id || element.isDeleted) continue
    const text = (element.text || element.originalText || "").trim()
    const next: CompactCanvasElement = {
      id: element.id,
      type: element.type || "unknown",
    }
    if (text) next.text = text
    if (typeof element.x === "number") next.x = Math.round(element.x)
    if (typeof element.y === "number") next.y = Math.round(element.y)
    if (element.containerId) next.containerId = element.containerId
    if (element.startBinding?.elementId) next.start = element.startBinding.elementId
    if (element.endBinding?.elementId) next.end = element.endBinding.elementId
    compact.push(next)
  }
  return compact
}
