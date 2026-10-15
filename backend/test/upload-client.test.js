const test = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const path = require('node:path')
const source = fs.readFileSync(path.join(__dirname, '../../frontend/services/api.js'), 'utf8')

test('客户端按二进制上传，服务错误不被吞掉', async () => {
  const data = new ArrayBuffer(12)
  const context = { module: { exports: {} }, wx: {
    getFileSystemManager: () => ({ readFile: options => options.success({ data }) }),
    request: options => {
      assert.equal(options.data, data)
      assert.equal(options.header['content-type'], 'application/octet-stream')
      assert.ok(options.url.endsWith('/api/images'))
      options.success({ statusCode: 415, data: { error: '格式无效' } })
    }
  } }
  vm.runInNewContext(source, context)
  await assert.rejects(context.module.exports.uploadImage('photo'), error => error.error === '格式无效')
})

test('客户端超限文件不发请求', async () => {
  let requests = 0
  const context = { module: { exports: {} }, wx: {
    getFileSystemManager: () => ({ readFile: options => options.success({ data: new ArrayBuffer(5 * 1024 * 1024 + 1) }) }),
    request: () => { requests++ }
  } }
  vm.runInNewContext(source, context)
  await assert.rejects(context.module.exports.uploadImage('photo'), error => error.error.includes('5MB'))
  assert.equal(requests, 0)
})
