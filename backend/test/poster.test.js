const test = require('node:test')
const assert = require('node:assert/strict')
const { dimensions, contain, wrapText, drawPoster } = require('../../frontend/services/poster')

test('两种导出比例与原图完整缩放', () => {
  assert.deepEqual(dimensions('1:1'), { width: 1080, height: 1080 })
  assert.deepEqual(dimensions('3:4'), { width: 1080, height: 1440 })
  assert.throws(() => dimensions('16:9'))
  const box = { x: 64, y: 142, width: 952, height: 522 }
  for (const [w, h] of [[2000, 100], [100, 2000], [800, 600]]) {
    const rect = contain(w, h, box)
    assert.ok(Math.abs(rect.width / rect.height - w / h) < 0.00001)
    assert.ok(rect.x >= box.x && rect.y >= box.y)
    assert.ok(rect.x + rect.width <= box.x + box.width + 0.001)
    assert.ok(rect.y + rect.height <= box.y + box.height + 0.001)
  }
})

test('长文案完整换行，三模板两比例三用途均不越界', () => {
  const fingerprints = new Set()
  for (const ratio of ['1:1', '3:4']) for (const templateId of ['warm-life', 'clean-studio', 'season-sale']) for (const variant of [0, 1, 2]) {
    const textCalls = []
    const imageCalls = []
    const ctx = {
      save() {}, restore() {}, beginPath() {}, rect() {}, clip() {},
      fillRect() {}, drawImage(image, x, y, width, height) { imageCalls.push({ x, y, width, height }) },
      measureText(text) { return { width: Array.from(text).length * Number(this.font.match(/(\d+)px/)[1]) } },
      fillText(text, x, y, maxWidth) {
        assert.ok(x + Math.min(this.measureText(text).width, maxWidth || Infinity) <= 1080)
        assert.ok(y + Number(this.font.match(/(\d+)px/)[1]) < dimensions(ratio).height - 48)
        textCalls.push(text)
      }
    }
    const product = { ratio, templateId, productName: '杯'.repeat(30), price: '99999999.99', features: ['手'.repeat(20), '工'.repeat(20), '陶'.repeat(20)] }
    const result = drawPoster(ctx, { width: 800, height: 1200 }, product, variant)
    fingerprints.add(`${ratio}:${result.photoBox.x}:${result.photoBox.y}:${result.photoBox.width}:${result.photoBox.height}`)
    assert.equal(imageCalls.length, 1)
    assert.ok(imageCalls[0].x >= result.photoBox.x - 0.001 && imageCalls[0].y >= result.photoBox.y - 0.001)
    assert.ok(imageCalls[0].x + imageCalls[0].width <= result.photoBox.x + result.photoBox.width + 0.001)
    assert.ok(imageCalls[0].y + imageCalls[0].height <= result.photoBox.y + result.photoBox.height + 0.001)
    assert.equal(textCalls.filter(text => /^杯/.test(text)).join(''), product.productName)
    if (variant === 1) {
      for (const feature of product.features) assert.equal(textCalls.join('').split(feature[0]).length - 1, feature.length)
    }
  }
  assert.equal(fingerprints.size, 18, '三模板、三用途和两比例应使用不同照片构图')
  const ctx = { measureText: text => ({ width: Array.from(text).length * 10 }) }
  assert.equal(wrapText(ctx, '商品😀测试', 20).join(''), '商品😀测试')
})

test('商品大小选项会放大照片，促销按钮使用自定义文案', () => {
  const imageCalls = [], textCalls = []
  const ctx = {
    save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, fillRect() {},
    drawImage(image, x, y, width, height) { imageCalls.push({ x, y, width, height }) },
    measureText(text) { return { width: String(text).length * 20 } },
    fillText(text) { textCalls.push(text) }
  }
  const base = { ratio: '1:1', templateId: 'warm-life', productName: '杯子', price: '99', features: [] }
  drawPoster(ctx, { width: 800, height: 800 }, { ...base, imageScale: 1 }, 2)
  drawPoster(ctx, { width: 800, height: 800 }, { ...base, imageScale: 1.3, promotionText: '私信下单' }, 2)
  assert.ok(imageCalls[1].width > imageCalls[0].width)
  assert.ok(textCalls.some(text => text.includes('私信下单')))
})

test('九宫格位置改变商品锚点并绘制品牌标识', () => {
  const imageCalls = [], textCalls = []
  const ctx = {
    save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, fillRect() {},
    drawImage(image, x, y, width, height) { imageCalls.push({ x, y, width, height }) },
    measureText(text) { return { width: String(text).length * 20 } },
    fillText(text) { textCalls.push(text) }
  }
  const base = { ratio: '1:1', templateId: 'warm-life', productName: '杯子', imageScale: 1.3, brandName: '小满手作', brandColor: '#14705c' }
  drawPoster(ctx, { width: 800, height: 800 }, { ...base, imagePosition: 'top-left' }, 0)
  drawPoster(ctx, { width: 800, height: 800 }, { ...base, imagePosition: 'bottom-right' }, 0)
  assert.ok(imageCalls[0].x > imageCalls[1].x || imageCalls[0].y > imageCalls[1].y)
  assert.ok(textCalls.filter(text => text === '小满手作').length === 2)
})

test('抠图主体会叠加多层商业画布而不是只铺纯色', () => {
  for (const templateId of ['warm-life', 'clean-studio', 'season-sale']) {
    const fills = [], images = []
    const ctx = {
      save() {}, restore() {}, beginPath() {}, rect() {}, clip() {},
      fillRect(x, y, width, height) { fills.push({ color: this.fillStyle, x, y, width, height }) },
      drawImage(image, x, y, width, height) { images.push({ x, y, width, height }) },
      measureText(text) { return { width: String(text).length * 18 } },
      fillText() {}
    }
    drawPoster(ctx, { width: 900, height: 900 }, { ratio: '1:1', templateId, productName: '商品', features: ['真实材质'] }, 1)
    assert.equal(images.length, 1)
    assert.ok(fills.length >= 12, `${templateId} 应包含画布、布景、展台和信息卡等多层背景`)
    assert.ok(new Set(fills.map(item => item.color)).size >= 6, `${templateId} 背景不应只是单一纯色`)
  }
})
