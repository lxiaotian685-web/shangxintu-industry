const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

function loadService() {
  const storage = new Map()
  const removed = []
  let counter = 0
  const wx = {
    getStorageSync: key => storage.get(key),
    setStorageSync: (key, value) => storage.set(key, value),
    removeStorageSync: key => storage.delete(key),
    saveFile: options => options.success({ savedFilePath: `saved-${counter++}.png` }),
    getFileSystemManager: () => ({ unlink: options => { removed.push(options.filePath) } })
  }
  const context = { module: { exports: {} }, wx, Date, Math, Promise }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../frontend/services/local-data.js'), 'utf8'), context)
  return { service: context.module.exports, storage, removed, wx }
}

test('草稿可保存、读取和清除', () => {
  const { service } = loadService()
  assert.equal(service.loadDraft(), null)
  assert.equal(service.saveDraft({ name: '杯子' }), true)
  assert.equal(service.loadDraft().name, '杯子')
  service.clearDraft()
  assert.equal(service.loadDraft(), null)
})

test('模板偏好可以保存并恢复', () => {
  const { service } = loadService()
  assert.equal(service.loadPreferences(), null)
  assert.equal(service.savePreferences({ ratio: '3:4', imagePosition: 'top-left' }), true)
  assert.equal(service.loadPreferences().imagePosition, 'top-left')
})

test('作品库最多六套，并删除被淘汰作品的三个文件', async () => {
  const { service, removed, wx } = loadService()
  for (let index = 0; index < 7; index++) await service.addWork({ draft: { name: `商品${index}`, price: '', features: [] }, generation: { templateId: 'warm-life', ratio: '1:1' }, outputs: ['a', 'b', 'c'] })
  const works = service.loadWorks()
  assert.equal(works.length, 6)
  assert.equal(works[0].name, '商品6')
  assert.equal(removed.length, 3)
  assert.deepEqual(service.removeWork(works[0].id).length, 5)
  assert.equal(removed.length, 6)
})

test('三张成片任一持久化失败会清理已保存文件且不新增作品', async () => {
  const { service, removed, wx } = loadService()
  let call = 0
  // The service reads wx at call time; replace saveFile only for this failure path.
  wx.saveFile = options => { call++; call === 2 ? options.fail(new Error('quota')) : options.success({ savedFilePath: 'partial.png' }) }
  await assert.rejects(service.addWork({ draft: { name: '商品', features: [] }, generation: { templateId: 'warm-life', ratio: '1:1' }, outputs: ['a', 'b', 'c'] }))
  assert.equal(service.loadWorks().length, 0)
  assert.deepEqual(removed, ['partial.png'])
})
