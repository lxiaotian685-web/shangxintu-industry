const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

test('AI 状态缓存相同图片结果并累计安全统计', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shangxintu-ai-state-'))
  process.env.DATA_DIRECTORY = directory
  const modulePath = require.resolve('../src/ai-state')
  delete require.cache[modulePath]
  const state = require('../src/ai-state')
  const hash = state.imageHash(Buffer.from('same image'))
  state.recordRequest()
  state.recordSuccess(hash, 'result.png')
  state.recordCacheHit()
  assert.equal(state.cachedImage(hash), 'result.png')
  assert.deepEqual(state.usage(), { requests: 1, successes: 1, cacheHits: 1, failures: 0, cachedImages: 1 })
  fs.rmSync(directory, { recursive: true })
})
