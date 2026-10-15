// Emulator default. For phone testing, replace 127.0.0.1 with the development
// computer's current LAN IP. Production must use an approved HTTPS domain.
const BASE_URL = 'http://127.0.0.1:3001'

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${path}`,
      method: options.method || 'GET',
      data: options.data,
      header: options.header || { 'content-type': 'application/json' },
      timeout: options.timeout || 10000,
      success: ({ statusCode, data }) => statusCode >= 200 && statusCode < 300 ? resolve(data) : reject(data || { error: '服务响应异常' }),
      fail: error => reject({ error: error.errMsg || '网络请求失败' })
    })
  })
}

module.exports = {
  uploadImage: filePath => new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({ filePath, success: ({ data }) => {
      if (data.byteLength > 5 * 1024 * 1024) return reject({ error: '图片不能超过 5MB，请压缩后重试' })
      request('/api/images', { method: 'POST', data, header: { 'content-type': 'application/octet-stream' } }).then(resolve, reject)
    }, fail: () => reject({ error: '无法读取原图，请返回重新选择' }) })
  }),
  getTemplates: () => request('/api/templates'),
  getCapabilities: () => request('/api/capabilities'),
  getBackendGenerations: (limit = 20) => request(`/api/generations?limit=${limit}`),
  removeBackground: imageId => request(`/api/images/${imageId}/remove-background`, { method: 'POST', timeout: 65000 }),
  generateScene: (imageId, data) => request(`/api/images/${imageId}/generate-scene`, { method: 'POST', data, timeout: 190000 }),
  downloadImage: imageId => new Promise((resolve, reject) => wx.downloadFile({
    url: `${BASE_URL}/api/images/${imageId}`,
    timeout: 15000,
    success: result => result.statusCode === 200 ? resolve(result.tempFilePath) : reject({ error: '处理后的图片下载失败' }),
    fail: error => reject({ error: error.errMsg || '处理后的图片下载失败' })
  })),
  createGeneration: data => request('/api/generations', { method: 'POST', data }),
  getGeneration: id => request(`/api/generations/${id}`)
}
