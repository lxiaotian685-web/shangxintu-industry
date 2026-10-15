const { randomUUID } = require('node:crypto')
const { templates } = require('./templates')
const { saveGeneration, findGeneration, listGenerations } = require('./store')
const { readBody, saveImage, findImage, MAX_IMAGE_BYTES } = require('./uploads')
const { removeBackground } = require('./remove-background')
const { generateScene, SCENES } = require('./wan-scene')
const aiState = require('./ai-state')
const { allowAiRequest, MAX_AI_REQUESTS } = require('./rate-limit')

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  })
  response.end(JSON.stringify(payload))
}

async function readJson(request) {
  const body = await readBody(request, 64 * 1024)
  try { return JSON.parse(body.toString() || '{}') } catch { throw new Error('JSON 格式无效') }
}

function validateGeneration(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return '请求必须是 JSON 对象'
  if (typeof input.productName !== 'string' || !input.productName.trim()) return 'productName 必填'
  if (input.productName.trim().length > 30) return 'productName 最多 30 字'
  if (!templates.some(item => item.id === input.templateId)) return 'templateId 不存在'
  if (!['1:1', '3:4'].includes(input.ratio)) return 'ratio 只支持 1:1 或 3:4'
  if (typeof input.imageId !== 'string') return '请先上传商品图片'
  if (input.price !== undefined && (typeof input.price !== 'string' || (input.price !== '' && !/^\d{1,8}(\.\d{1,2})?$/.test(input.price)))) return '价格最多八位整数和两位小数'
  if (input.features !== undefined && (!Array.isArray(input.features) || input.features.length > 3 || input.features.some(value => typeof value !== 'string' || !value.trim() || value.length > 20))) return '卖点最多三条，每条 1 至 20 字'
  if (input.promotionText !== undefined && (typeof input.promotionText !== 'string' || input.promotionText.length > 12)) return '促销按钮文案最多 12 字'
  if (input.imageScale !== undefined && ![1, 1.15, 1.3].includes(input.imageScale)) return '商品大小选项无效'
  if (input.imagePosition !== undefined && !['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'].includes(input.imagePosition)) return '商品位置选项无效'
  if (input.brandName !== undefined && (typeof input.brandName !== 'string' || input.brandName.length > 12)) return '品牌名称最多 12 字'
  if (input.brandColor !== undefined && !['#b53f00', '#1f5f99', '#14705c', '#6b46a2', '#222222'].includes(input.brandColor)) return '品牌颜色选项无效'
  return null
}

async function app(request, response) {
  const url = new URL(request.url, 'http://localhost')
  if (request.method === 'OPTIONS') return sendJson(response, 204, {})
  if (request.method === 'GET' && url.pathname === '/health') return sendJson(response, 200, { status: 'ok' })
  if (request.method === 'GET' && url.pathname === '/api/capabilities') return sendJson(response, 200, { data: { aiCutout: { available: Boolean(process.env.REMOVE_BG_API_KEY), provider: 'remove.bg', hourlyLimitPerIp: MAX_AI_REQUESTS }, aiScene: { available: Boolean(process.env.DASHSCOPE_API_KEY), provider: 'wan2.6-image', scenes: SCENES.map(({ id, name, description }) => ({ id, name, description })) }, limits: { imageBytes: MAX_IMAGE_BYTES, generationsStored: 200 }, usage: aiState.usage() } })
  if (request.method === 'GET' && url.pathname === '/api/templates') return sendJson(response, 200, { data: templates })
  if (request.method === 'GET' && url.pathname === '/api/generations') {
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 50)
    return sendJson(response, 200, { data: listGenerations(limit) })
  }

  if (request.method === 'POST' && url.pathname === '/api/images') {
    try {
      const buffer = await readBody(request, MAX_IMAGE_BYTES)
      return sendJson(response, 201, { data: await saveImage(buffer) })
    } catch (error) { return sendJson(response, error.status || 500, { error: error.status ? error.message : '图片保存失败，请重试' }) }
  }

  const imageMatch = url.pathname.match(/^\/api\/images\/([^/]+)$/)
  if (request.method === 'GET' && imageMatch) {
    try {
      const buffer = await findImage(imageMatch[1])
      if (!buffer) return sendJson(response, 404, { error: '图片不存在，请重新上传' })
      response.writeHead(200, { 'Content-Type': imageMatch[1].endsWith('.png') ? 'image/png' : 'image/jpeg', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' })
      return response.end(buffer)
    } catch { return sendJson(response, 500, { error: '图片读取失败' }) }
  }

  const cutoutMatch = url.pathname.match(/^\/api\/images\/([^/]+)\/remove-background$/)
  if (request.method === 'POST' && cutoutMatch) {
    try {
      const original = await findImage(cutoutMatch[1])
      if (!original) return sendJson(response, 404, { error: '商品图片不存在，请重新上传' })
      const hash = aiState.imageHash(original)
      const cachedId = aiState.cachedImage(hash)
      const cached = cachedId && await findImage(cachedId)
      if (cached) {
        aiState.recordCacheHit()
        return sendJson(response, 200, { data: { id: cachedId, size: cached.length, provider: 'remove.bg', cached: true } })
      }
      if (!process.env.REMOVE_BG_API_KEY) throw Object.assign(new Error('AI 抠图尚未配置，请在后端设置 REMOVE_BG_API_KEY'), { status: 503 })
      const rate = allowAiRequest(request.socket.remoteAddress || 'unknown')
      if (!rate.allowed) return sendJson(response, 429, { error: 'AI 处理次数过于频繁，请稍后再试', retryAfterSeconds: rate.retryAfterSeconds })
      aiState.recordRequest()
      const result = await removeBackground(original)
      const saved = await saveImage(result)
      aiState.recordSuccess(hash, saved.id)
      return sendJson(response, 201, { data: { ...saved, provider: 'remove.bg', cached: false } })
    } catch (error) {
      if (error.status && error.status !== 503) aiState.recordFailure()
      return sendJson(response, error.status || 500, { error: error.status ? error.message : 'AI 抠图失败，请重试' })
    }
  }

  const sceneMatch = url.pathname.match(/^\/api\/images\/([^/]+)\/generate-scene$/)
  if (request.method === 'POST' && sceneMatch) {
    try {
      const original = await findImage(sceneMatch[1])
      if (!original) return sendJson(response, 404, { error: '商品图片不存在，请重新上传' })
      const input = await readJson(request)
      const scene = SCENES.find(item => item.id === input.sceneId)
      if (!scene || !['1:1', '3:4'].includes(input.ratio)) return sendJson(response, 400, { error: 'AI 场景或图片比例无效' })
      const cacheKey = `${aiState.imageHash(original)}:scene:${scene.id}:${input.ratio}`
      const cachedId = aiState.cachedImage(cacheKey)
      const cached = cachedId && await findImage(cachedId)
      if (cached) {
        aiState.recordCacheHit()
        return sendJson(response, 200, { data: { id: cachedId, size: cached.length, provider: 'wan2.6-image', sceneId: scene.id, cached: true } })
      }
      if (!process.env.DASHSCOPE_API_KEY) throw Object.assign(new Error('AI 商业场景尚未配置，请在后端设置 DASHSCOPE_API_KEY'), { status: 503 })
      const rate = allowAiRequest(request.socket.remoteAddress || 'unknown')
      if (!rate.allowed) return sendJson(response, 429, { error: 'AI 处理次数过于频繁，请稍后再试', retryAfterSeconds: rate.retryAfterSeconds })
      aiState.recordRequest()
      const result = await generateScene(original, { sceneId: scene.id, ratio: input.ratio, mimeType: sceneMatch[1].endsWith('.png') ? 'image/png' : 'image/jpeg' })
      const saved = await saveImage(result)
      aiState.recordSuccess(cacheKey, saved.id)
      return sendJson(response, 201, { data: { ...saved, provider: 'wan2.6-image', sceneId: scene.id, cached: false } })
    } catch (error) {
      if (error.status && error.status !== 503) aiState.recordFailure()
      return sendJson(response, error.status || 500, { error: error.status ? error.message : 'AI 商业场景生成失败，请重试' })
    }
  }

  if (request.method === 'POST' && url.pathname === '/api/generations') {
    try {
      const input = await readJson(request)
      const error = validateGeneration(input)
      if (error) return sendJson(response, 400, { error })
      if (!await findImage(input.imageId)) return sendJson(response, 400, { error: '商品图片不存在，请重新上传' })
      const generation = saveGeneration({
        id: randomUUID(),
        productName: input.productName.trim(),
        templateId: input.templateId,
        ratio: input.ratio,
        imageId: input.imageId,
        price: input.price || '',
        features: input.features || [],
        promotionText: input.promotionText || '',
        imageScale: input.imageScale || 1,
        imagePosition: input.imagePosition || 'center',
        brandName: input.brandName || '',
        brandColor: input.brandColor || '#b53f00',
        status: 'ready_for_render',
        mode: 'local-canvas',
        createdAt: new Date().toISOString()
      })
      return sendJson(response, 201, { data: generation })
    } catch (error) {
      return sendJson(response, error.status || (error.message === 'JSON 格式无效' ? 400 : 500), { error: error.status || error.message === 'JSON 格式无效' ? error.message : '生成记录保存失败，请重试' })
    }
  }

  const match = url.pathname.match(/^\/api\/generations\/([^/]+)$/)
  if (request.method === 'GET' && match) {
    const generation = findGeneration(match[1])
    return generation ? sendJson(response, 200, { data: generation }) : sendJson(response, 404, { error: '生成任务不存在' })
  }
  return sendJson(response, 404, { error: '接口不存在' })
}

module.exports = { app, validateGeneration }
