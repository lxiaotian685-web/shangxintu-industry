const windows = new Map()
const WINDOW_MS = 60 * 60 * 1000
const MAX_AI_REQUESTS = 10

function allowAiRequest(key, now = Date.now()) {
  const current = windows.get(key)
  if (!current || now - current.startedAt >= WINDOW_MS) {
    windows.set(key, { startedAt: now, count: 1 })
    return { allowed: true, remaining: MAX_AI_REQUESTS - 1 }
  }
  if (current.count >= MAX_AI_REQUESTS) return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((WINDOW_MS - (now - current.startedAt)) / 1000) }
  current.count++
  return { allowed: true, remaining: MAX_AI_REQUESTS - current.count }
}

module.exports = { allowAiRequest, MAX_AI_REQUESTS, WINDOW_MS }
