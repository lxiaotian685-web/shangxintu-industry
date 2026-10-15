const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')

const frontendDir = path.join(__dirname, '../../frontend')

// WXML 允许的官方标签；出现白名单外的标签说明写错了组件名。
const WXML_TAGS = new Set([
  'view', 'scroll-view', 'swiper', 'swiper-item', 'movable-area', 'movable-view', 'cover-view', 'cover-image',
  'text', 'rich-text', 'icon', 'progress', 'label', 'button', 'checkbox', 'checkbox-group', 'form', 'input',
  'radio', 'radio-group', 'picker', 'picker-view', 'picker-view-column', 'slider', 'switch', 'textarea',
  'navigator', 'image', 'video', 'camera', 'live-player', 'live-pusher', 'map', 'canvas', 'open-data',
  'web-view', 'ad', 'official-account', 'block', 'template', 'import', 'include', 'slot', 'page-meta', 'navigation-bar'
])

function collectFiles(dir, extension) {
  const found = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) found.push(...collectFiles(full, extension))
    else if (entry.name.endsWith(extension)) found.push(full)
  }
  return found
}

const relative = file => path.relative(path.join(__dirname, '../..'), file).replace(/\\/g, '/')

test('所有 JSON 文件都能解析', () => {
  const files = [...collectFiles(frontendDir, '.json'), ...collectFiles(path.join(__dirname, '..'), '.json')]
  assert.ok(files.length >= 8, `发现的 JSON 文件过少：${files.length}`)
  for (const file of files) assert.doesNotThrow(() => JSON.parse(fs.readFileSync(file, 'utf8')), `${relative(file)} 不是合法 JSON`)
})

test('所有前端与后端 JavaScript 都能通过语法编译', () => {
  const files = [...collectFiles(frontendDir, '.js'), ...collectFiles(path.join(__dirname, '..', 'src'), '.js')]
  assert.ok(files.length >= 15, `发现的 JS 文件过少：${files.length}`)
  for (const file of files) assert.doesNotThrow(() => new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file }), `${relative(file)} 存在语法错误`)
})

test('WXML 只使用允许标签且标签正确闭合', () => {
  const files = collectFiles(frontendDir, '.wxml')
  assert.ok(files.length >= 5, `发现的 WXML 文件过少：${files.length}`)
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '')
    const stack = []
    const pattern = /<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g
    let match
    while ((match = pattern.exec(text))) {
      const [, closing, name, , selfClosing] = match
      assert.ok(WXML_TAGS.has(name), `${relative(file)} 使用了未允许的标签 <${name}>`)
      if (selfClosing) continue
      if (closing) assert.equal(stack.pop(), name, `${relative(file)} 的 </${name}> 与上一个开始标签不匹配`)
      else stack.push(name)
    }
    assert.deepEqual(stack, [], `${relative(file)} 存在未闭合标签：${stack.join(', ')}`)
  }
})

test('WXSS 大括号成对出现', () => {
  const files = collectFiles(frontendDir, '.wxss')
  assert.ok(files.length >= 5, `发现的 WXSS 文件过少：${files.length}`)
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    const open = (text.match(/\{/g) || []).length
    const close = (text.match(/\}/g) || []).length
    assert.equal(open, close, `${relative(file)} 大括号不成对：{ ${open} 个，} ${close} 个`)
  }
})

test('前端不出现另一个项目的 3000 端口，仍固定使用 3001', () => {
  const files = [...collectFiles(frontendDir, '.js'), ...collectFiles(frontendDir, '.json')]
  for (const file of files) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /:3000\b/, `${relative(file)} 出现了 3000 端口`)
  assert.match(fs.readFileSync(path.join(frontendDir, 'services/api.js'), 'utf8'), /http:\/\/[\d.]+:3001/, '前端 API 基址不再指向 3001')
})
