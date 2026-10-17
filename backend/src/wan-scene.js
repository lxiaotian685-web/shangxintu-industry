const SCENES = [
  { id: 'studio', name: '洁净影棚', description: '中性背景与清晰产品光', prompt: '专业工业品摄影棚，中性浅灰无缝背景，清晰轮廓光、柔和主光与自然接触阴影，画面严谨克制' },
  { id: 'lifestyle', name: '应用场景', description: '车间或实验室使用氛围', prompt: '真实可信的工业应用环境，整洁车间或实验室背景，专业照明，少量相关设备虚化陪衬，不遮挡产品主体' },
  { id: 'premium', name: '深色质感', description: '聚光与高端设备氛围', prompt: '高端工业设备商业摄影，深色金属渐变背景，轮廓光与聚焦光，精密、可靠且不遮挡产品' },
  { id: 'fresh', name: '品牌色块', description: '明亮色块与现代科技感', prompt: '现代工业品牌视觉，低饱和几何色块，干净柔光，明亮专业，适合新品发布' }
]

const RATIOS = { '1:1': '1280*1280', '3:4': '960*1280' }

function serviceError(message, status = 502) {
  return Object.assign(new Error(message), { status })
}

async function responseJson(response, fallback) {
  let payload = {}
  try { payload = await response.json() } catch {}
  if (!response.ok) {
    const detail = payload.message || payload.code || fallback
    throw serviceError(`AI 生图服务返回错误：${detail}`)
  }
  return payload
}

function outputUrl(payload) {
  const content = payload.output && payload.output.choices && payload.output.choices[0] && payload.output.choices[0].message && payload.output.choices[0].message.content
  const item = Array.isArray(content) && content.find(value => value && value.image)
  return item && item.image
}

async function generateScene(image, options = {}) {
  const apiKey = options.apiKey || process.env.DASHSCOPE_API_KEY
  const fetchImpl = options.fetchImpl || fetch
  const waitImpl = options.waitImpl || (ms => new Promise(resolve => setTimeout(resolve, ms)))
  const maxPolls = options.maxPolls || 40
  const scene = SCENES.find(item => item.id === (options.sceneId || 'studio'))
  const size = RATIOS[options.ratio || '1:1']
  if (!apiKey) throw serviceError('AI 商业场景尚未配置，请在后端设置 DASHSCOPE_API_KEY', 503)
  if (!scene || !size) throw serviceError('AI 场景或图片比例无效', 400)

  // The shared Beijing endpoint accepts pay-as-you-go keys from any workspace.
  // A dedicated endpoint can be supplied later after it is verified in the console.
  const baseUrl = options.baseUrl || process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1'
  if (!/^https:\/\/[A-Za-z0-9.-]+\.aliyuncs\.com\/api\/v1$/.test(baseUrl)) throw serviceError('DASHSCOPE_BASE_URL 格式无效', 500)
  const prompt = `严格保留参考图中工业产品主体的颜色、形状、尺寸比例、接口、材质、数量、包装、铭牌、标签和 Logo，不新增、不删除、不变形产品，不虚构结构或使用方式。仅重新设计背景、光影和陈列氛围：${scene.prompt}。产品完整清晰、位于视觉中心，专业商业摄影，背景不得出现文字、参数、价格或水印。`
  const created = await responseJson(await fetchImpl(`${baseUrl}/services/aigc/image-generation/generation`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-DashScope-Async': 'enable' },
    body: JSON.stringify({
      model: 'wan2.6-image',
      input: { messages: [{ role: 'user', content: [{ text: prompt }, { image: `data:${options.mimeType || 'image/jpeg'};base64,${image.toString('base64')}` }] }] },
      parameters: { prompt_extend: true, watermark: false, n: 1, enable_interleave: false, size, negative_prompt: '文字，水印，虚构参数，错误 Logo，铭牌变化，接口变化，产品变形，产品数量变化，包装变化，模糊，低清晰度，多余物体遮挡产品' }
    })
  }), '创建任务失败')
  const taskId = created.output && created.output.task_id
  if (!taskId) throw serviceError('AI 生图服务没有返回任务编号')

  for (let attempt = 0; attempt < maxPolls; attempt++) {
    if (attempt > 0) await waitImpl(options.pollIntervalMs || 4000)
    const task = await responseJson(await fetchImpl(`${baseUrl}/tasks/${encodeURIComponent(taskId)}`, { headers: { Authorization: `Bearer ${apiKey}` } }), '查询任务失败')
    const status = task.output && task.output.task_status
    if (status === 'FAILED' || status === 'CANCELED' || status === 'UNKNOWN') throw serviceError(`AI 生图失败：${(task.output && (task.output.message || task.output.code)) || status}`)
    if (status !== 'SUCCEEDED') continue
    const url = outputUrl(task)
    if (!url) throw serviceError('AI 生图已完成，但没有返回图片')
    const result = await fetchImpl(url)
    if (!result.ok) throw serviceError('AI 图片下载失败')
    return Buffer.from(await result.arrayBuffer())
  }
  throw serviceError('AI 生图等待超时，请稍后重试', 504)
}

module.exports = { generateScene, SCENES, RATIOS }
