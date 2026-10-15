const localData = require('../../services/local-data')
const album = require('../../services/album')

Page({
  data: { works: [], savingId: '', savingAllId: '', saveProgress: '', permissionDenied: false },
  onShow() { this.setData({ works: localData.loadWorks().map(item => ({ ...item, dateText: formatDate(item.createdAt), aiLabel: aiLabel(item) })) }) },
  preview(e) {
    const work = this.data.works.find(item => item.id === e.currentTarget.dataset.id)
    if (work && work.outputs && work.outputs.length) wx.previewImage({ current: work.outputs[Number(e.currentTarget.dataset.index) || 0], urls: work.outputs })
  },
  reuse(e) {
    const work = this.data.works.find(item => item.id === e.currentTarget.dataset.id)
    if (!work || !work.sourcePath) return wx.showToast({ title: '旧作品没有保留原图，请重新选图', icon: 'none' })
    const draft = { imagePath: work.sourcePath, name: work.name, price: work.price || '', promotionText: work.promotionText || '', brandName: work.brandName || '', brandColor: work.brandColor || '#b53f00', features: work.features || [] }
    localData.saveDraft(draft)
    getApp().globalData.draft = draft
    localData.savePreferences({ selectedId: work.templateId || 'warm-life', ratio: work.ratio || '1:1', imageScale: work.imageScale || 1, imagePosition: work.imagePosition || 'center', processingMode: processingModeOf(work), sceneId: work.sceneId || 'studio', processingVersion: 2 })
    wx.navigateTo({ url: '/pages/upload/upload' })
  },
  saveMain(e) {
    const id = e.currentTarget.dataset.id
    const work = this.data.works.find(item => item.id === id)
    if (!work || !work.outputs[0] || this.data.savingId) return
    this.setData({ savingId: id, permissionDenied: false })
    wx.saveImageToPhotosAlbum({ filePath: work.outputs[0], success: () => wx.showToast({ title: '主图已保存', icon: 'success' }), fail: error => {
      const denied = /auth|deny|denied/i.test(error.errMsg || '')
      this.setData({ permissionDenied: denied })
      wx.showModal({ title: '未保存', content: denied ? '请打开相册权限后重试。' : '本地作品文件可能已失效，请重新制作。', showCancel: false })
    }, complete: () => this.setData({ savingId: '' }) })
  },
  async saveAll(e) {
    const id = e.currentTarget.dataset.id
    const work = this.data.works.find(item => item.id === id)
    if (!work || work.outputs.length !== 3 || this.data.savingId || this.data.savingAllId) return
    this.setData({ savingAllId: id, permissionDenied: false, saveProgress: '0/3' })
    try {
      await album.saveAll(work.outputs, (saved, total) => this.setData({ saveProgress: `${saved}/${total}` }))
      wx.showToast({ title: '整套已保存', icon: 'success' })
    } catch (error) {
      this.setData({ permissionDenied: Boolean(error.denied) })
      wx.showModal({ title: `已保存 ${error.saved || 0}/3 张`, content: error.denied ? '请打开相册权限后重试。' : '部分本地文件可能失效，请重新制作这套图片。', showCancel: false })
    } finally { this.setData({ savingAllId: '', saveProgress: '' }) }
  },
  remove(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({ title: '删除这套作品？', content: '三张本地成片都会删除，无法恢复。', success: result => {
      if (!result.confirm) return
      try { this.setData({ works: localData.removeWork(id) }) } catch { wx.showToast({ title: '删除失败，请重试', icon: 'none' }) }
    } })
  },
  openSettings() { wx.openSetting({}) },
  create() { wx.navigateTo({ url: '/pages/upload/upload' }) }
})

function aiLabel(work) {
  if (work.aiMode === 'scene') return 'AI 场景'
  if (work.aiMode === 'cutout' || work.aiProcessed) return 'AI 抠图'
  return ''
}

function processingModeOf(work) {
  if (work.aiMode === 'scene') return 'ai-scene'
  if (work.aiMode === 'cutout' || work.aiProcessed) return 'ai-cutout'
  return 'original'
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  const pad = number => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
