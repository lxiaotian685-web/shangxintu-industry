const localData = require('../../services/local-data')
Page({
  data: { hasDraft: false, draftName: '', worksCount: 0, recentWork: null },
  onShow() {
    const draft = localData.loadDraft()
    const works = localData.loadWorks()
    this.setData({ hasDraft: Boolean(draft && draft.imagePath), draftName: draft && draft.name || '未命名商品', worksCount: works.length, recentWork: works[0] || null })
  },
  start() { wx.navigateTo({ url: '/pages/upload/upload' }) },
  previewRecent() { if (this.data.recentWork) wx.previewImage({ current: this.data.recentWork.outputs[0], urls: this.data.recentWork.outputs }) },
  openTemplates() { wx.navigateTo({ url: '/pages/templates/templates' }) },
  openWorks() { wx.navigateTo({ url: '/pages/works/works' }) }
})
