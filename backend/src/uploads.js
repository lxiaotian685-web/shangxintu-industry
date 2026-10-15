const fs = require('node:fs/promises')
const path = require('node:path')
const { randomUUID } = require('node:crypto')

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const directory = process.env.UPLOAD_DIRECTORY ? path.resolve(process.env.UPLOAD_DIRECTORY) : path.resolve(__dirname, '../data/uploads')

function readBody(request, limit) {
  return new Promise((resolve, reject) => {
    let chunks = [], size = 0, failed = false
    request.on('data', chunk => {
      if (failed) return
      size += chunk.length
      if (size > limit) {
        failed = true
        chunks = []
        return reject(Object.assign(new Error('文件或请求内容过大'), { status: 413 }))
      }
      chunks.push(chunk)
    })
    request.on('end', () => { if (!failed) resolve(Buffer.concat(chunks)) })
    request.on('error', reject)
    request.on('aborted', () => reject(new Error('上传已中断')))
  })
}

function imageType(buffer) {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && buffer.toString('ascii', 12, 16) === 'IHDR') return 'png'
  if (buffer.length >= 4 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255 && buffer[buffer.length - 2] === 255 && buffer[buffer.length - 1] === 217) return 'jpg'
  return null
}

async function saveImage(buffer) {
  const ext = imageType(buffer)
  if (!ext) throw Object.assign(new Error('仅支持 PNG 或 JPEG 图片，请换一张图片'), { status: 415 })
  const id = `${randomUUID()}.${ext}`
  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(path.join(directory, id), buffer, { flag: 'wx' })
  return { id, size: buffer.length }
}

async function findImage(id) {
  // Never accept user-provided directory paths or original filenames.
  if (typeof id !== 'string' || !/^[a-f0-9-]{36}\.(png|jpg)$/.test(id)) return null
  try { return await fs.readFile(path.join(directory, id)) } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

module.exports = { readBody, saveImage, findImage, imageType, MAX_IMAGE_BYTES }
