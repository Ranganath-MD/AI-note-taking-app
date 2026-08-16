import { createServerFn } from "@tanstack/react-start"

import { geminiApiKey, geminiModel } from "@/lib/server-env"

type GenerateInput = {
  instruction: string
  existingBody: string
}

const SYSTEM = `You write notes for a local note-taking app.
Return only simple HTML TipTap can store: p, h2, h3, ul, ol, li, strong, em, blockquote.
Do not wrap the answer in markdown fences.
Do not repeat the existing note. Add new material based on the user instruction.`

function extractHtml(text: string) {
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i)
  return (fenced?.[1] ?? text).trim()
}

function geminiErrorMessage(status: number, body: string) {
  let detail = body.slice(0, 400)
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } }
    if (parsed.error?.message) detail = parsed.error.message
  } catch {
    /* use raw slice */
  }
  if (status === 401 || status === 403 || /api key not valid/i.test(detail)) {
    return "Gemini rejected this API key. AI Studio now issues AQ. auth keys — they must stay in .env (server only), not in the browser. Create a new key at aistudio.google.com/apikey if this one is restricted or leaked."
  }
  if (status === 404) {
    return detail || "Gemini model not found. Try VITE_GEMINI_MODEL=gemini-3.5-flash in .env."
  }
  if (status === 429) {
    return "Gemini free quota was hit. Wait and try again."
  }
  return detail || `Gemini request failed (${status}).`
}

async function postGemini(url: string, apiKey: string, body: unknown) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  })
}

const MODEL_FALLBACKS = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash"]

async function generateWithGemini(apiKey: string, model: string, prompt: string) {
  const tried = new Set<string>()
  const candidates = [model, ...MODEL_FALLBACKS].filter((id) => {
    if (tried.has(id)) return false
    tried.add(id)
    return true
  })

  let lastStatus = 0
  let lastBody = ""
  for (const id of candidates) {
    const generateResponse = await postGemini(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(id)}:generateContent`,
      apiKey,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
      }
    )
    const generateRaw = await generateResponse.text()
    if (generateResponse.ok) {
      const json = JSON.parse(generateRaw) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      return json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? ""
    }
    lastStatus = generateResponse.status
    lastBody = generateRaw
    if (generateResponse.status !== 404) break
  }

  throw new Error(geminiErrorMessage(lastStatus, lastBody))
}

export const generateNoteFn = createServerFn({ method: "POST", strict: false })
  .validator((data: GenerateInput) => data)
  .handler(async ({ data }) => {
    const apiKey = geminiApiKey()
    if (!apiKey) {
      throw new Error("Missing VITE_GEMINI_API_KEY. Add it to .env and restart the dev server.")
    }
    const model = geminiModel()
    const instruction = data.instruction.trim()
    if (!instruction) {
      throw new Error("Type a prompt to generate a note.")
    }
    const existing = data.existingBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000)
    const prompt = [
      SYSTEM,
      `User instruction: ${instruction}`,
      existing ? `Existing note (do not repeat):\n${existing}` : "Existing note is empty.",
    ].join("\n\n")

    const text = await generateWithGemini(apiKey, model, prompt)
    const html = extractHtml(text)
    if (!html) {
      throw new Error("Gemini returned an empty note.")
    }
    return { html }
  })
