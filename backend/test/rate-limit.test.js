const test = require('node:test')
const assert = require('node:assert/strict')
const { allowAiRequest, MAX_AI_REQUESTS, WINDOW_MS } = require('../src/rate-limit')

test('每个来源每小时最多允许固定次数 AI 请求', () => {
  const start = 1000
  for (let index = 0; index < MAX_AI_REQUESTS; index++) assert.equal(allowAiRequest('client-a', start).allowed, true)
  const blocked = allowAiRequest('client-a', start)
  assert.equal(blocked.allowed, false)
  assert.ok(blocked.retryAfterSeconds > 0)
  assert.equal(allowAiRequest('client-a', start + WINDOW_MS).allowed, true)
  assert.equal(allowAiRequest('client-b', start).allowed, true)
})
