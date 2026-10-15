const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')

function loadPage(name, api = {}, wxOverrides = {}) {
  let page
  const events = []
  const app = { globalData: { draft: { name: '杯子' } } }
  const localData = { loadDraft: () => null, saveDraft: () => true, clearDraft() {}, loadPreferences: () => null, savePreferences: () => true, loadWorks: () => [], addWork: async () => ({}), removeWork: () => [] }
  const context = {
    setTimeout, clearTimeout,
    Page(value) { page = value }, require(module) {
      if (module.endsWith('/poster')) return require('../../frontend/services/poster')
      if (module.endsWith('/local-data')) return { ...localData, ...(api.localData || {}) }
      return {
        uploadImage: async () => ({ data: { id: 'test.png' } }),
        removeBackground: async () => ({ data: { id: 'cutout.png', provider: 'remove.bg' } }),
        generateScene: async () => ({ data: { id: 'scene.png', provider: 'wan2.6-image', sceneId: 'studio' } }),
        downloadImage: async () => 'cutout.png',
        ...api
      }
    }, getApp() { return app },
    wx: { showToast(value) { events.push(value) }, showModal(value) { events.push(value) }, navigateTo(value) { events.push(value) }, ...wxOverrides }
  }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../frontend/pages', name, `${name}.js`), 'utf8'), context)
  page.setData = (values, callback) => { Object.assign(page.data, values); if (callback) callback() }
  return { page, app, events }
}

test('失败不跳转预览，恢复按钮供重试', async () => {
  const { page, events } = loadPage('templates', { createGeneration: () => Promise.reject({ error: '测试断网' }) })
  page.generate()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(page.data.loading, false)
  assert.equal(events[0].title, '任务创建失败')
  assert.equal(events.some(event => event.url), false)
})

test('旧版抠图偏好在生图可用时只迁移一次到 AI 场景', async () => {
  let saved
  const { page } = loadPage('templates', {
    localData: { loadPreferences: () => ({ processingMode: 'ai-cutout' }), savePreferences: value => { saved = value } },
    getTemplates: async () => ({ data: [] }),
    getCapabilities: async () => ({ data: { aiCutout: { available: true }, aiScene: { available: true, scenes: [] } } })
  })
  page.onLoad()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(page.data.processingMode, 'ai-scene')
  assert.equal(saved.processingVersion, 2)
})

test('图片上传失败不创建任务、不跳转', async () => {
  let calls = 0
  const { page, events } = loadPage('templates', { uploadImage: async () => { throw { error: '图片过大' } }, createGeneration: async () => { calls++ } })
  page.generate()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(calls, 0)
  assert.equal(events[0].content, '图片过大')
  assert.equal(page.data.loading, false)
})

test('保存被拒绝时不提示成功，展示权限入口并恢复按钮', () => {
  const { page, events } = loadPage('preview', {}, { saveImageToPhotosAlbum(options) { options.fail({ errMsg: 'auth deny' }); options.complete() } })
  Object.assign(page.data, { currentPath: 'poster.png', loading: false })
  page.save()
  assert.equal(page.data.permissionDenied, true)
  assert.equal(page.data.saving, false)
  assert.equal(events[0].title, '未保存')
})

test('Canvas 制作三份 PNG，预览切换使用真实导出路径', async () => {
  let exports = 0
  const ctx = { fillRect() {}, fillText() {}, drawImage() {}, save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, measureText: text => ({ width: text.length * 30 }) }
  const canvas = { getContext: () => ctx, createImage() { const image = { width: 800, height: 600 }; Object.defineProperty(image, 'src', { set() { image.onload() } }); return image } }
  const query = { in() { return this }, select() { return this }, fields() { return this }, exec(callback) { callback([{ node: canvas }]) } }
  const { page, app } = loadPage('preview', {}, { createSelectorQuery: () => query, canvasToTempFilePath(options) { assert.equal(options.destHeight, 1440); options.success({ tempFilePath: `poster-${exports++}.png` }) } })
  app.globalData.generation = { mode: 'local-canvas', productName: '杯子', ratio: '3:4', templateId: 'warm-life', features: ['手作'] }
  page.onLoad()
  await page.render()
  assert.equal(exports, 3)
  assert.equal(page.data.loading, false)
  page.select({ currentTarget: { dataset: { index: 2 } } })
  assert.equal(page.data.currentPath, 'poster-2.png')
})

test('重复点击只创建一个任务，成功后跳转', async () => {
  let calls = 0
  const { page, app, events } = loadPage('templates', { createGeneration: async () => { calls++; return { data: { id: 'test', demo: true } } } })
  page.generate(); page.generate()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(calls, 1)
  assert.equal(app.globalData.generation.id, 'test')
  assert.equal(events[0].url, '/pages/preview/preview')
})

test('AI 模式使用透明抠图制作，原图模式不调用 AI', async () => {
  let removals = 0
  const api = {
    removeBackground: async () => { removals++; return { data: { id: 'cutout.png', provider: 'remove.bg' } } },
    downloadImage: async () => 'cutout-local.png',
    createGeneration: async input => ({ data: { ...input, id: 'generation', mode: 'local-canvas' } })
  }
  const first = loadPage('templates', api)
  first.page.generate()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(removals, 1)
  assert.equal(first.app.globalData.generation.renderImagePath, 'cutout-local.png')
  assert.equal(first.app.globalData.generation.aiProcessed, true)

  const second = loadPage('templates', api)
  second.page.data.processingMode = 'original'
  second.page.generate()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(removals, 1)
  assert.equal(second.app.globalData.generation.aiProcessed, false)
})

test('AI 商业场景模式传递风格和比例并使用生成结果', async () => {
  let input
  const { page, app } = loadPage('templates', {
    generateScene: async (imageId, data) => { input = { imageId, ...data }; return { data: { id: 'scene.png', provider: 'wan2.6-image', sceneId: data.sceneId } } },
    downloadImage: async () => 'scene-local.png',
    createGeneration: async value => ({ data: { ...value, id: 'generation', mode: 'local-canvas' } })
  })
  Object.assign(page.data, { processingMode: 'ai-scene', sceneId: 'premium', ratio: '3:4' })
  page.generate()
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(input, { imageId: 'test.png', sceneId: 'premium', ratio: '3:4' })
  assert.equal(app.globalData.generation.aiMode, 'scene')
  assert.equal(app.globalData.generation.renderImagePath, 'scene-local.png')
})

test('离开模板页后，迟到的请求不强制跳回预览', async () => {
  const { page, events } = loadPage('templates', { createGeneration: async () => ({ data: { id: 'test' } }) })
  page.generate()
  page.onUnload()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(events.length, 0)
})

test('上传校验价格，并自动带入未点击添加的卖点', () => {
  const { page, app, events } = loadPage('upload')
  Object.assign(page.data, { imagePath: 'local-image', name: '杯子', price: '1.234', featureText: '手作' })
  page.next()
  assert.equal(events.some(event => event.url), false)
  page.data.price = '19.90'
  page.next()
  assert.equal(app.globalData.draft.features[0], '手作')
  assert.equal(events.at(-1).url, '/pages/templates/templates')
})

test('上传页恢复草稿，输入后同步保存', () => {
  let saved
  const draft = { imagePath: 'saved-photo', name: '旧商品', price: '20', features: ['耐用'] }
  const { page } = loadPage('upload', { localData: { loadDraft: () => draft, saveDraft: value => { saved = value } } })
  page.onLoad()
  assert.equal(page.data.imagePath, 'saved-photo')
  page.onName({ detail: { value: '新商品' } })
  assert.equal(saved.name, '新商品')
})

test('预览页收藏整套且防止重复点击', async () => {
  let calls = 0
  let release
  const pending = new Promise(resolve => { release = resolve })
  const { page, app } = loadPage('preview', { localData: { addWork: async () => { calls++; await pending } } })
  app.globalData.generation = { mode: 'local-canvas', ratio: '1:1', templateId: 'warm-life' }
  page.onLoad()
  Object.assign(page.data, { loading: false, outputs: ['1', '2', '3'] })
  const first = page.collect()
  page.collect()
  release()
  await first
  assert.equal(calls, 1)
  assert.equal(page.data.collected, true)
})

test('作品库区分 AI 场景与 AI 抠图，再次编辑恢复该作品的制作参数', () => {
  let savedPreferences
  const works = [
    { id: 'a', sourcePath: 'photo.png', name: '杯子', aiMode: 'scene', sceneId: 'premium', templateId: 'clean-studio', ratio: '3:4', imageScale: 1.3, imagePosition: 'top-left', outputs: ['1', '2', '3'] },
    { id: 'b', sourcePath: 'photo2.png', name: '盘子', aiProcessed: true, outputs: ['1', '2', '3'] }
  ]
  const { page } = loadPage('works', { localData: { loadWorks: () => works, savePreferences: value => { savedPreferences = value } } })
  page.onShow()
  assert.equal(page.data.works[0].aiLabel, 'AI 场景')
  assert.equal(page.data.works[1].aiLabel, 'AI 抠图')
  page.reuse({ currentTarget: { dataset: { id: 'a' } } })
  assert.equal(savedPreferences.processingMode, 'ai-scene')
  assert.equal(savedPreferences.selectedId, 'clean-studio')
  assert.equal(savedPreferences.sceneId, 'premium')
  assert.equal(savedPreferences.imagePosition, 'top-left')
})

test('作品页三个操作按钮使用两行自适应布局', () => {
  const css = fs.readFileSync(path.join(__dirname, '../../frontend/pages/works/works.wxss'), 'utf8')
  const wxml = fs.readFileSync(path.join(__dirname, '../../frontend/pages/works/works.wxml'), 'utf8')
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/)
  assert.match(css, /\.work-actions \.save-all\{grid-column:1\/3\}/)
  assert.match(css, /\.work-actions button\{[^}]*width:100%[^}]*min-width:0[^}]*margin:0/)
  assert.match(wxml, /class="save-all"/)
  assert.match(wxml, />仅保存主图<\/button>/)
  assert.match(wxml, />删除作品<\/button>/)
})
