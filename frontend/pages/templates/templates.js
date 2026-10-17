const api = require('../../services/api')
const localData = require('../../services/local-data')
const fallbackTemplates = [
  { id: 'warm-life', name: '制造橙标准版', description: '暖灰展台、清晰主体与稳重品牌感', tone: 'warm' },
  { id: 'clean-studio', name: '技术蓝图版', description: '冷静网格、参数信息与设备技术感', tone: 'clean' },
  { id: 'season-sale', name: '新品发布版', description: '高对比展台、参考报价与询价行动区', tone: 'sale' }
]
const fallbackScenes = [
  { id: 'studio', name: '洁净影棚', description: '中性背景与清晰产品光' },
  { id: 'lifestyle', name: '应用场景', description: '车间或实验室使用氛围' },
  { id: 'premium', name: '深色质感', description: '聚光与高端设备氛围' },
  { id: 'fresh', name: '品牌色块', description: '明亮色块与现代科技感' }
]
Page({
  data: { templates: fallbackTemplates, scenes: fallbackScenes, sceneId: 'studio', positions: ['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'], selectedId: 'warm-life', ratio: '1:1', imageScale: 1, imagePosition: 'center', processingMode: 'ai-cutout', aiAvailable: null, aiSceneAvailable: null, aiStatusText: '正在检查 AI 服务', loading: false, loadingText: '' },
  onLoad() {
    const saved = localData.loadPreferences()
    if (saved) this.setData(saved)
    api.getTemplates().then(({ data }) => this.setData({ templates: data })).catch(() => {})
    api.getCapabilities().then(({ data }) => {
      const available = Boolean(data.aiCutout && data.aiCutout.available)
      const sceneAvailable = Boolean(data.aiScene && data.aiScene.available)
      const scenes = data.aiScene && data.aiScene.scenes && data.aiScene.scenes.length ? data.aiScene.scenes : fallbackScenes
      const fallbackMode = sceneAvailable ? 'ai-scene' : (available ? 'ai-cutout' : 'original')
      const selectedModeAvailable = (this.data.processingMode === 'ai-scene' && sceneAvailable) || (this.data.processingMode === 'ai-cutout' && available) || this.data.processingMode === 'original'
      const needsSceneUpgrade = sceneAvailable && (!saved || saved.processingVersion !== 2)
      const processingMode = needsSceneUpgrade || !selectedModeAvailable ? fallbackMode : this.data.processingMode
      this.setData({ aiAvailable: available, aiSceneAvailable: sceneAvailable, scenes, processingMode, aiStatusText: sceneAvailable ? 'AI 商业场景可用' : 'AI 生图待配置' }, () => this.remember({ processingMode }))
    }).catch(() => this.setData({ aiAvailable: null, aiStatusText: '无法读取 AI 状态，可使用原图模式' }))
  },
  onUnload() { this.disposed = true },
  remember(values) { this.setData(values, () => localData.savePreferences({ selectedId: this.data.selectedId, ratio: this.data.ratio, imageScale: this.data.imageScale, imagePosition: this.data.imagePosition, processingMode: this.data.processingMode, sceneId: this.data.sceneId, processingVersion: 2 })) },
  select(e) { this.remember({ selectedId: e.currentTarget.dataset.id }) },
  ratio(e) { this.remember({ ratio: e.currentTarget.dataset.ratio }) },
  processingMode(e) {
    const mode = e.currentTarget.dataset.mode
    if (mode === 'ai-cutout' && this.data.aiAvailable === false) return wx.showModal({ title: 'AI 尚未配置', content: '请先在后端配置 REMOVE_BG_API_KEY；目前可以继续使用原图排版。', showCancel: false })
    if (mode === 'ai-scene' && this.data.aiSceneAvailable === false) return wx.showModal({ title: 'AI 生图尚未配置', content: '请先在后端配置 DASHSCOPE_API_KEY；目前可以使用原图或智能抠图。', showCancel: false })
    this.remember({ processingMode: mode })
  },
  scene(e) { this.remember({ sceneId: e.currentTarget.dataset.id }) },
  imageScale(e) { this.remember({ imageScale: Number(e.currentTarget.dataset.scale) }) },
  imagePosition(e) { this.remember({ imagePosition: e.currentTarget.dataset.position }) },
  generate() {
    if (this.data.loading) return
    const draft = getApp().globalData.draft
    if (!draft) return wx.showModal({ title: '还没有商品信息', content: '请先完成上传步骤', showCancel: false, success: () => wx.redirectTo({ url: '/pages/upload/upload' }) })
    this.setData({ loading: true, loadingText: '正在上传产品原图…' })
    const selection = { templateId: this.data.selectedId, ratio: this.data.ratio, imageScale: this.data.imageScale, imagePosition: this.data.imagePosition }
    api.uploadImage(draft.imagePath)
      .then(async ({ data }) => {
        if (this.data.processingMode === 'original') return { imageId: data.id, renderImagePath: draft.imagePath, aiProcessed: false, aiMode: 'original' }
        if (!this.disposed) this.setData({ loadingText: this.data.processingMode === 'ai-scene' ? 'AI 正在重构商业场景，约需 1～3 分钟…' : 'AI 正在识别并抠出商品…' })
        const processed = this.data.processingMode === 'ai-scene'
          ? (await api.generateScene(data.id, { sceneId: this.data.sceneId, ratio: this.data.ratio })).data
          : (await api.removeBackground(data.id)).data
        const renderImagePath = await api.downloadImage(processed.id)
        return { imageId: processed.id, renderImagePath, aiProcessed: true, aiMode: this.data.processingMode === 'ai-scene' ? 'scene' : 'cutout', aiProvider: processed.provider, sceneId: processed.sceneId || '' }
      })
      .then(async processed => {
        if (!this.disposed) this.setData({ loadingText: '正在制作三张产品素材…' })
        const response = await api.createGeneration({ productName: draft.name, imageId: processed.imageId, price: draft.price, promotionText: draft.promotionText, brandName: draft.brandName, brandColor: draft.brandColor, features: draft.features, ...selection })
        return { ...response, processed }
      })
      .then(({ data, processed }) => { if (!this.disposed) { getApp().globalData.generation = { ...data, ...processed }; wx.navigateTo({ url: '/pages/preview/preview' }) } })
      .catch(error => { if (!this.disposed) wx.showModal({ title: '任务创建失败', content: error.error || '无法连接后端。请确认服务已启动及网络设置正确，然后重试。', showCancel: false }) })
      .finally(() => { if (!this.disposed) this.setData({ loading: false, loadingText: '' }) })
  }
})
