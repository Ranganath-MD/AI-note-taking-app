import { readFileSync } from "node:fs"
import path from "node:path"

function parseEnvFile(contents: string) {
  const values: Record<string, string> = {}
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    values[key] = value
  }
  return values
}

function readLocalEnv() {
  const values: Record<string, string> = {}
  let dir = process.cwd()
  for (let i = 0; i < 6; i++) {
    for (const file of [".env", ".env.local"]) {
      try {
        Object.assign(values, parseEnvFile(readFileSync(path.join(dir, file), "utf8")))
      } catch {
        /* file missing */
      }
    }
    if (values.VITE_GEMINI_API_KEY || values.GEMINI_API_KEY) break
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return values
}

function clean(value: string | undefined) {
  const next = value?.trim()
  if (!next || next === "undefined" || next === "null") return undefined
  return next
}

export function geminiApiKey() {
  const file = readLocalEnv()
  return (
    clean(import.meta.env.VITE_GEMINI_API_KEY) ||
    clean(file.VITE_GEMINI_API_KEY) ||
    clean(file.GEMINI_API_KEY) ||
    clean(process.env.VITE_GEMINI_API_KEY) ||
    clean(process.env.GEMINI_API_KEY)
  )
}

export function geminiModel() {
  const file = readLocalEnv()
  return (
    clean(import.meta.env.VITE_GEMINI_MODEL) ||
    clean(file.VITE_GEMINI_MODEL) ||
    clean(file.GEMINI_MODEL) ||
    clean(process.env.VITE_GEMINI_MODEL) ||
    clean(process.env.GEMINI_MODEL) ||
    "gemini-3.5-flash"
  )
}
