export function snippetFromBody(body: string, max = 110) {
  const compact = body
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
  if (compact.length <= max) return compact
  return `${compact.slice(0, max).trim()}...`
}

export function formatNoteTime(timestamp: number, now = Date.now()) {
  const date = new Date(timestamp)
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  if (timestamp >= startOfToday.getTime()) {
    return `Today, ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })}`
  }

  if (timestamp >= startOfYesterday.getTime()) {
    return "Yesterday"
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function formatSavedAgo(timestamp: number, now = Date.now()) {
  const delta = Math.max(0, now - timestamp)
  const minutes = Math.round(delta / 60_000)
  if (minutes < 1) return "Saved locally: just now"
  if (minutes === 1) return "Saved locally: 1m ago"
  if (minutes < 60) return `Saved locally: ${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Saved locally: ${hours}h ago`
  return `Saved locally: ${formatNoteTime(timestamp, now)}`
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
