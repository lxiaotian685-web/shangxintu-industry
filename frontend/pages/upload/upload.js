const localData = require('../../services/local-data')
Page({
  data: { imagePath: '', name: '', price: '', promotionText: '', brandName: '', brandColor: '#b53f00', brandColors: ['#b53f00', '#1f5f99', '#14705c', '#6b46a2', '#222222'], featureText: '', features: [] },
  onLoad() {
    const draft = localData.loadDraft()
    if (draft) this.setData({ imagePath: draft.imagePath || '', name: draft.name || '', price: draft.price || '', promotionText: draft.promotionText || '', brandName: draft.brandName || '', brandColor: draft.brandColor || '#b53f00', features: Array.isArray(draft.features) ? draft.features : [] })
  },
  persist() { localData.saveDraft({ imagePath: this.data.imagePath, name: this.data.name, price: this.data.price, promotionText: this.data.promotionText, brandName: this.data.brandName, brandColor: this.data.brandColor, features: this.data.features }) },
  chooseImage() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album', 'camera'], success: ({ tempFiles }) => {
      if (!tempFiles.length) return
      if (tempFiles[0].size > 5 * 1024 * 1024) return wx.showToast({ title: '图片不能超过 5MB', icon: 'none' })
      wx.saveFile({ tempFilePath: tempFiles[0].tempFilePath, success: result => this.setData({ imagePath: result.savedFilePath }, () => this.persist()), fail: () => { this.setData({ imagePath: tempFiles[0].tempFilePath }, () => this.persist()); wx.showToast({ title: '图片仅本次使用', icon: 'none' }) } })
    }, fail: error => { if (!/cancel/i.test(error.errMsg || '')) wx.showToast({ title: '选图失败，请检查相机或相册权限', icon: 'none' }) } })
  },
  onName(e) { this.setData({ name: e.detail.value }, () => this.persist()) },
  onPrice(e) { this.setData({ price: e.detail.value }, () => this.persist()) },
  onPromotion(e) { this.setData({ promotionText: e.detail.value }, () => this.persist()) },
  onBrandName(e) { this.setData({ brandName: e.detail.value }, () => this.persist()) },
  selectBrandColor(e) { this.setData({ brandColor: e.currentTarget.dataset.color }, () => this.persist()) },
  onFeature(e) { this.setData({ featureText: e.detail.value }) },
  addFeature() {
    const value = this.data.featureText.trim()
    if (!value || this.data.features.length >= 3) return
    this.setData({ features: [...this.data.features, value], featureText: '' }, () => this.persist())
  },
  removeFeature(e) { this.setData({ features: this.data.features.filter((_, index) => index !== Number(e.currentTarget.dataset.index)) }, () => this.persist()) },
  next() {
    if (!this.data.imagePath || !this.data.name.trim()) return wx.showToast({ title: '请上传图片并填写名称', icon: 'none' })
    if (this.data.price.trim() && !/^\d{1,8}(\.\d{1,2})?$/.test(this.data.price.trim())) return wx.showToast({ title: '价格最多八位整数和两位小数', icon: 'none' })
    if (this.data.featureText.trim()) {
      if (this.data.features.length >= 3) return wx.showToast({ title: '最多三个卖点，请清空未添加内容', icon: 'none' })
      this.addFeature()
    }
    getApp().globalData.draft = { imagePath: this.data.imagePath, name: this.data.name.trim(), price: this.data.price.trim(), promotionText: this.data.promotionText.trim(), brandName: this.data.brandName.trim(), brandColor: this.data.brandColor, features: this.data.features }
    localData.saveDraft(getApp().globalData.draft)
    wx.navigateTo({ url: '/pages/templates/templates' })
  }
})
