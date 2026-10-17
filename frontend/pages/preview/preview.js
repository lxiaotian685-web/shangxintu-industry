const { dimensions, drawPoster } = require('../../services/poster')
const localData = require('../../services/local-data')
const album = require('../../services/album')
Page({
  data: { selected: 0, variants: ['产品主图', '参数卖点图', '渠道海报'], outputs: [], currentPath: '', loading: true, saving: false, savingAll: false, saveProgress: '', collecting: false, collected: false, error: '', permissionDenied: false, aiProcessed: false, aiMode: 'original', compareMode: 'processed', originalPath: '', processedPath: '', summary: { name: '', price: '', brandName: '', features: [] } },
  onLoad() {
    this.draft = getApp().globalData.draft
    this.product = getApp().globalData.generation
    if (!this.draft || !this.product || this.product.mode !== 'local-canvas') {
      this.invalid = true
      wx.redirectTo({ url: '/pages/upload/upload' })
    } else {
      this.setData({ aiProcessed: Boolean(this.product.aiProcessed), aiMode: this.product.aiMode || (this.product.aiProcessed ? 'cutout' : 'original'), originalPath: this.draft.imagePath, processedPath: this.product.renderImagePath || '', summary: { name: this.draft.name || this.product.productName || '', price: this.draft.price || '', brandName: this.draft.brandName || '', features: Array.isArray(this.draft.features) ? this.draft.features : [] } })
    }
  },
  onReady() { if (!this.invalid) this.render() },
  onUnload() { this.disposed = true },
  async render() {
    if (this.rendering || this.disposed) return
    this.rendering = true
    this.setData({ loading: true, error: '', outputs: [], currentPath: '' })
    try {
      const canvas = await new Promise((resolve, reject) => {
        wx.createSelectorQuery().in(this).select('#poster').fields({ node: true, size: true }).exec(result => {
          if (!result[0] || !result[0].node) return reject(new Error('画布初始化失败，请重新编译或升级微信'))
          resolve(result[0].node)
        })
      })
      const { width, height } = dimensions(this.product.ratio)
      canvas.width = width
      canvas.height = height
      const image = await new Promise((resolve, reject) => {
        const value = canvas.createImage()
        const timer = setTimeout(() => reject(new Error('图片读取超时，请返回重新选图')), 10000)
        value.onload = () => { clearTimeout(timer); resolve(value) }
        value.onerror = () => { clearTimeout(timer); reject(new Error('原图无法读取，请返回重新选图')) }
        value.src = this.product.renderImagePath || this.draft.imagePath
      })
      const outputs = []
      for (let variant = 0; variant < 3; variant++) {
        if (this.disposed) return
        drawPoster(canvas.getContext('2d'), image, this.product, variant)
        const filePath = await new Promise((resolve, reject) => wx.canvasToTempFilePath({ canvas, x: 0, y: 0, width, height, destWidth: width, destHeight: height, fileType: 'png', success: result => resolve(result.tempFilePath), fail: () => reject(new Error('图片导出失败，请重试')) }))
        outputs.push(filePath)
      }
      if (!this.disposed) this.setData({ outputs, currentPath: outputs[this.data.selected] })
    } catch (error) {
      if (!this.disposed) this.setData({ error: error.message || '制作失败，请重试' })
    } finally {
      this.rendering = false
      if (!this.disposed) this.setData({ loading: false })
    }
  },
  select(e) {
    if (this.data.loading || this.data.saving) return
    const selected = Number(e.currentTarget.dataset.index)
    this.setData({ selected, currentPath: this.data.outputs[selected] || '' })
  },
  save() {
    if (!this.data.currentPath || this.data.saving || this.data.loading) return
    this.setData({ saving: true, permissionDenied: false })
    wx.saveImageToPhotosAlbum({
      filePath: this.data.currentPath,
      success: () => wx.showToast({ title: '已保存当前图片', icon: 'success' }),
      fail: error => {
        const denied = /auth|deny|denied/i.test(error.errMsg || '')
        this.setData({ permissionDenied: denied })
        wx.showModal({ title: '未保存', content: denied ? '相册权限未开启。请点击页面上的“打开相册权限设置”，授权后再次保存。' : '图片保存失败，请检查相册空间或重新制作后重试。', showCancel: false })
      },
      complete: () => { if (!this.disposed) this.setData({ saving: false }) }
    })
  },
  async saveAll() {
    if (this.data.outputs.length !== 3 || this.data.saving || this.data.savingAll || this.data.loading) return
    this.setData({ savingAll: true, permissionDenied: false, saveProgress: '正在保存 1/3' })
    try {
      await album.saveAll(this.data.outputs, (saved, total) => this.setData({ saveProgress: `正在保存 ${Math.min(saved + 1, total)}/${total}` }))
      wx.showToast({ title: '三张已全部保存', icon: 'success' })
    } catch (error) {
      this.setData({ permissionDenied: Boolean(error.denied) })
      wx.showModal({ title: `已保存 ${error.saved || 0}/3 张`, content: error.denied ? '请打开相册权限，再点击保存整套。' : '保存中断，请检查相册空间后重试；已经保存的图片不会重复删除。', showCancel: false })
    } finally {
      if (!this.disposed) this.setData({ savingAll: false, saveProgress: '' })
    }
  },
  compare(e) { this.setData({ compareMode: e.currentTarget.dataset.mode }) },
  openSettings() { wx.openSetting({}) },
  async collect() {
    if (this.data.loading || this.data.collecting || this.data.collected || this.data.outputs.length !== 3) return
    this.setData({ collecting: true })
    try {
      await localData.addWork({ draft: this.draft, generation: this.product, outputs: this.data.outputs })
      this.setData({ collected: true })
      wx.showToast({ title: '已收藏到作品库', icon: 'success' })
    } catch {
      wx.showModal({ title: '收藏失败', content: '本地存储空间可能不足，请删除旧作品后重试。', showCancel: false })
    } finally { if (!this.disposed) this.setData({ collecting: false }) }
  },
  edit() { wx.navigateBack({ delta: 2 }) },
  restart() { localData.clearDraft(); getApp().globalData.draft = null; getApp().globalData.generation = null; wx.reLaunch({ url: '/pages/upload/upload' }) }
})
