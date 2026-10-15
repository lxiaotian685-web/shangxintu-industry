const test = require('node:test')
const assert = require('node:assert/strict')
const { generateScene } = require('../src/wan-scene')

test('未配置百炼密钥时拒绝 AI 生图', async () => {
  await assert.rejects(() => generateScene(Buffer.from('image'), { apiKey: '' }), error => error.status === 503 && /DASHSCOPE_API_KEY/.test(error.message))
})

test('提交参考图、轮询任务并立即下载 AI 结果', async () => {
  const source = Buffer.from('source image')
  const output = Buffer.from('generated image')
  let polls = 0
  const result = await generateScene(source, {
    apiKey: 'test-key',
    sceneId: 'premium',
    ratio: '3:4',
    mimeType: 'image/png',
    waitImpl: async () => {},
    fetchImpl: async (url, options = {}) => {
      if (url.endsWith('/generation')) {
        const body = JSON.parse(options.body)
        assert.equal(options.headers['X-DashScope-Async'], 'enable')
        assert.equal(body.model, 'wan2.6-image')
        assert.equal(body.parameters.n, 1)
        assert.equal(body.parameters.size, '960*1280')
        assert.match(body.input.messages[0].content[1].image, /^data:image\/png;base64,/)
        assert.match(body.input.messages[0].content[0].text, /严格保留/)
        return Response.json({ output: { task_id: 'task-1' } })
      }
      if (url.endsWith('/tasks/task-1')) {
        polls++
        return Response.json({ output: polls === 1 ? { task_status: 'RUNNING' } : { task_status: 'SUCCEEDED', choices: [{ message: { content: [{ image: 'https://result.test/image.png' }] } }] } })
      }
      if (url === 'https://result.test/image.png') return new Response(output)
      throw new Error(`unexpected url ${url}`)
    }
  })
  assert.deepEqual(result, output)
  assert.equal(polls, 2)
})

test('将 AI 任务失败转换成可操作错误', async () => {
  let calls = 0
  await assert.rejects(() => generateScene(Buffer.from('source'), {
    apiKey: 'test-key', sceneId: 'studio', ratio: '1:1', waitImpl: async () => {},
    fetchImpl: async () => Response.json(calls++ === 0 ? { output: { task_id: 'task-2' } } : { output: { task_status: 'FAILED', message: '内容审核未通过' } })
  }), error => error.status === 502 && /内容审核未通过/.test(error.message))
})
