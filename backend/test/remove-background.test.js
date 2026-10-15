const test = require('node:test')
const assert = require('node:assert/strict')
const { removeBackground, REMOVE_BG_URL } = require('../src/remove-background')

test('未配置密钥时拒绝 AI 抠图', async () => {
  await assert.rejects(() => removeBackground(Buffer.from('image'), { apiKey: '' }), error => error.status === 503 && /REMOVE_BG_API_KEY/.test(error.message))
})

test('向 remove.bg 上传图片并返回 PNG 字节', async () => {
  const output = Buffer.from('processed png')
  const result = await removeBackground(Buffer.from('source'), {
    apiKey: 'test-key',
    fetchImpl: async (url, options) => {
      assert.equal(url, REMOVE_BG_URL)
      assert.equal(options.method, 'POST')
      assert.equal(options.headers['X-Api-Key'], 'test-key')
      assert.equal(options.body.get('size'), 'auto')
      assert.equal(options.body.get('format'), 'png')
      return new Response(output, { status: 200 })
    }
  })
  assert.deepEqual(result, output)
})

test('将额度和密钥错误转换成可操作提示', async () => {
  for (const [status, message] of [[402, '额度已用完'], [403, '密钥无效']]) {
    await assert.rejects(() => removeBackground(Buffer.from('source'), {
      apiKey: 'test-key',
      fetchImpl: async () => new Response('{}', { status })
    }), error => error.message.includes(message))
  }
})
