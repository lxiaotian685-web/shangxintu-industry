const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

function loadAlbum(saveImageToPhotosAlbum) {
  const context = { module: { exports: {} }, Promise, Error, Object, wx: { saveImageToPhotosAlbum } }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../frontend/services/album.js'), 'utf8'), context)
  return context.module.exports
}

test('依次保存整套图片并报告进度', async () => {
  const saved = [], progress = []
  const album = loadAlbum(options => { saved.push(options.filePath); options.success() })
  assert.equal(await album.saveAll(['1.png', '2.png', '3.png'], value => progress.push(value)), 3)
  assert.deepEqual(saved, ['1.png', '2.png', '3.png'])
  assert.deepEqual(progress, [1, 2, 3])
})

test('保存中断时报告已保存数量和权限状态', async () => {
  let call = 0
  const album = loadAlbum(options => { call++; call === 2 ? options.fail({ errMsg: 'auth deny' }) : options.success() })
  await assert.rejects(album.saveAll(['1.png', '2.png', '3.png']), error => error.denied === true && error.saved === 1 && error.total === 3)
})
