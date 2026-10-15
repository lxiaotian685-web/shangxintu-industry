const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

test('生成任务写入磁盘并在模块重新加载后恢复', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shangxintu-store-'))
  process.env.DATA_DIRECTORY = directory
  const modulePath = require.resolve('../src/store')
  delete require.cache[modulePath]
  let store = require('../src/store')
  store.saveGeneration({ id: 'persisted', productName: '杯子', createdAt: '2026-09-18T00:00:00.000Z' })
  delete require.cache[modulePath]
  store = require('../src/store')
  assert.equal(store.findGeneration('persisted').productName, '杯子')
  assert.equal(store.listGenerations(1)[0].id, 'persisted')
  fs.rmSync(directory, { recursive: true })
})
