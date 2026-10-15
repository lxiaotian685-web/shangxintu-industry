const fs = require('node:fs')
const path = require('node:path')

const dataDirectory = process.env.DATA_DIRECTORY ? path.resolve(process.env.DATA_DIRECTORY) : path.resolve(__dirname, '../data')
const filePath = path.join(dataDirectory, 'generations.json')
const generations = new Map()
let loaded = false

function load() {
  if (loaded) return
  loaded = true
  try {
    const items = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    if (Array.isArray(items)) for (const item of items) if (item && item.id) generations.set(item.id, item)
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('生成记录读取失败，将使用空记录：', error.message)
  }
}

function persist() {
  fs.mkdirSync(dataDirectory, { recursive: true })
  const temp = `${filePath}.tmp`
  fs.writeFileSync(temp, JSON.stringify([...generations.values()].slice(-200), null, 2))
  fs.renameSync(temp, filePath)
}

function saveGeneration(generation) {
  load()
  generations.set(generation.id, generation)
  while (generations.size > 200) generations.delete(generations.keys().next().value)
  persist()
  return generation
}

function findGeneration(id) {
  load()
  return generations.get(id)
}

function listGenerations(limit = 20) {
  load()
  return [...generations.values()].slice(-limit).reverse()
}

module.exports = { saveGeneration, findGeneration, listGenerations }
