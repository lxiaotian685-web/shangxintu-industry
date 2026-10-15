const REMOVE_BG_URL = 'https://api.remove.bg/v1.0/removebg'

async function removeBackground(buffer, options = {}) {
  const apiKey = options.apiKey || process.env.REMOVE_BG_API_KEY
  const fetchImpl = options.fetchImpl || fetch
  if (!apiKey) throw Object.assign(new Error('AI 抠图尚未配置，请在后端设置 REMOVE_BG_API_KEY'), { status: 503 })

  const form = new FormData()
  form.append('image_file', new Blob([buffer]), 'product.jpg')
  form.append('size', 'auto')
  form.append('format', 'png')

  let response
  try {
    response = await fetchImpl(REMOVE_BG_URL, {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: form,
      signal: AbortSignal.timeout(60000)
    })
  } catch (error) {
    if (error.name === 'TimeoutError') throw Object.assign(new Error('AI 抠图超时，请稍后重试'), { status: 504 })
    throw Object.assign(new Error('无法连接 AI 抠图服务，请检查后端网络'), { status: 502 })
  }

  if (!response.ok) {
    let detail = ''
    try { detail = (await response.json()).errors?.[0]?.title || '' } catch {}
    const message = response.status === 402 ? 'AI 抠图额度已用完，请检查套餐' : response.status === 403 ? 'AI 抠图密钥无效或无权限' : `AI 抠图失败${detail ? `：${detail}` : ''}`
    throw Object.assign(new Error(message), { status: response.status === 429 ? 429 : 502 })
  }
  return Buffer.from(await response.arrayBuffer())
}

module.exports = { removeBackground, REMOVE_BG_URL }
