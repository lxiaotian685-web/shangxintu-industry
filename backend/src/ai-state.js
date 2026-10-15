const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')

const dataDirectory = process.env.DATA_DIRECTORY ? path.resolve(process.env.DATA_DIRECTORY) : path.resolve(__dirname, '../data')
const filePath = path.join(dataDirectory, 'ai-state.json')
let state

function load() {
  if (state) return state
  try { state = JSON.parse(fs.readFileSync(filePath, 'utf8')) } catch { state = { cache: {}, usage: { requests: 0, successes: 0, cacheHits: 0, failures: 0 } } }
  state.cache ||= {}
  state.usage ||= { requests: 0, successes: 0, cacheHits: 0, failures: 0 }
  return state
}

function persist() {
  fs.mkdirSync(dataDirectory, { recursive: true })
  const temp = `${filePath}.tmp`
  fs.writeFileSync(temp, JSON.stringify(state, null, 2))
  fs.renameSync(temp, filePath)
}

function imageHash(buffer) { return createHash('sha256').update(buffer).digest('hex') }
function cachedImage(hash) { return load().cache[hash] || null }
function recordCacheHit() { load().usage.cacheHits++; persist() }
function recordRequest() { load().usage.requests++; persist() }
function recordSuccess(hash, imageId) { const value = load(); value.usage.successes++; value.cache[hash] = imageId; persist() }
function recordFailure() { load().usage.failures++; persist() }
function usage() { return { ...load().usage, cachedImages: Object.keys(load().cache).length } }

module.exports = { imageHash, cachedImage, recordCacheHit, recordRequest, recordSuccess, recordFailure, usage }
