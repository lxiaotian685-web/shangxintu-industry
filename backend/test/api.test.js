const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const uploadDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'shangxintu-test-'))
process.env.UPLOAD_DIRECTORY = uploadDirectory
process.env.DATA_DIRECTORY = uploadDirectory
const { app, validateGeneration } = require('../src/app')
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64')
test.after(() => {
  for (const name of fs.readdirSync(uploadDirectory)) fs.unlinkSync(path.join(uploadDirectory, name))
  fs.rmdirSync(uploadDirectory)
})

test('校验合法的生成请求', () => {
  assert.equal(validateGeneration({ productName: '粗陶杯', templateId: 'warm-life', ratio: '1:1', imageId: 'test.png' }), null)
})

test('拒绝不存在的模板', () => {
  assert.equal(validateGeneration({ productName: '粗陶杯', templateId: 'missing', ratio: '1:1' }), 'templateId 不存在')
})

test('拒绝空对象、空白名称和超长名称', () => {
  for (const input of [null, [], {}, { productName: '   ' }, { productName: '杯'.repeat(31) }]) {
    assert.ok(validateGeneration(input))
  }
})

test('上传原图字节不变，创建并查询排版任务，未知任务返回 404', async t => {
  const server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}`
  const uploaded = await fetch(`${base}/api/images`, { method: 'POST', body: png })
  assert.equal(uploaded.status, 201)
  const image = (await uploaded.json()).data
  const retrieved = await fetch(`${base}/api/images/${image.id}`)
  assert.equal(retrieved.headers.get('content-type'), 'image/png')
  assert.deepEqual(Buffer.from(await retrieved.arrayBuffer()), png)
  const created = await fetch(`${base}/api/generations`, { method: 'POST', body: JSON.stringify({ productName: '杯子', templateId: 'warm-life', ratio: '3:4', imageId: image.id, price: '19.90', features: ['手作'] }) })
  assert.equal(created.status, 201)
  const { data } = await created.json()
  assert.equal(data.mode, 'local-canvas')
  assert.equal(data.status, 'ready_for_render')
  assert.equal(data.imageId, image.id)
  assert.equal(data.price, '19.90')
  const queried = await fetch(`${base}/api/generations/${data.id}`).then(response => response.json())
  assert.deepEqual(queried.data, data)
  assert.equal((await fetch(`${base}/api/generations/missing`)).status, 404)
})

test('拒绝伪装图片、超限上传、未知原图和路径穿越', async t => {
  const server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}`
  assert.equal((await fetch(`${base}/api/images`, { method: 'POST', body: '<svg>not a photo</svg>' })).status, 415)
  assert.equal((await fetch(`${base}/api/images`, { method: 'POST', body: Buffer.alloc(5 * 1024 * 1024 + 1) })).status, 413)
  assert.equal((await fetch(`${base}/api/images/..%2fserver.js`)).status, 404)
  assert.equal((await fetch(`${base}/api/generations`, { method: 'POST', body: JSON.stringify({ productName: '杯子', templateId: 'warm-life', ratio: '1:1', imageId: 'missing.png' }) })).status, 400)
  assert.equal(fs.readdirSync(uploadDirectory).filter(name => /\.(png|jpg)$/.test(name)).every(name => /^[a-f0-9-]{36}\.(png|jpg)$/.test(name)), true)
})

test('服务端校验价格与卖点', () => {
  const valid = { productName: '杯', templateId: 'warm-life', ratio: '1:1', imageId: 'test.png' }
  for (const fields of [{ price: '-1' }, { price: '1.234' }, { price: 1 }, { features: [''] }, { features: ['字'.repeat(21)] }, { features: ['1', '2', '3', '4'] }]) assert.ok(validateGeneration({ ...valid, ...fields }))
})

test('服务端校验促销文案与商品大小', () => {
  const valid = { productName: '杯', templateId: 'warm-life', ratio: '1:1', imageId: 'test.png' }
  assert.equal(validateGeneration({ ...valid, promotionText: '立即抢购', imageScale: 1.15 }), null)
  assert.ok(validateGeneration({ ...valid, promotionText: '超'.repeat(13) }))
  assert.ok(validateGeneration({ ...valid, imageScale: 2 }))
  assert.equal(validateGeneration({ ...valid, imagePosition: 'top-left', brandName: '小满手作', brandColor: '#14705c' }), null)
  assert.ok(validateGeneration({ ...valid, imagePosition: 'outside' }))
  assert.ok(validateGeneration({ ...valid, brandName: '品'.repeat(13) }))
  assert.ok(validateGeneration({ ...valid, brandColor: '#ffffff' }))
})

test('健康检查返回 ok', async () => {
  const server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  const result = await fetch(`http://127.0.0.1:${port}/health`).then(response => response.json())
  server.close()
  assert.deepEqual(result, { status: 'ok' })
})

test('能力接口不泄露密钥，并可列出持久化生成任务', async t => {
  const server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}`
  const capabilities = await fetch(`${base}/api/capabilities`).then(response => response.json())
  assert.equal(typeof capabilities.data.aiCutout.available, 'boolean')
  assert.equal(typeof capabilities.data.aiScene.available, 'boolean')
  assert.equal(capabilities.data.aiScene.provider, 'wan2.6-image')
  assert.equal(capabilities.data.aiScene.scenes.length, 4)
  assert.equal(JSON.stringify(capabilities).includes('REMOVE_BG_API_KEY'), false)
  assert.equal(JSON.stringify(capabilities).includes('DASHSCOPE_API_KEY'), false)
  assert.equal(typeof capabilities.data.usage.cacheHits, 'number')
  const generations = await fetch(`${base}/api/generations?limit=1`).then(response => response.json())
  assert.equal(generations.data.length, 1)
  assert.ok(generations.data[0].id)
})
