function saveOne(filePath) {
  return new Promise((resolve, reject) => wx.saveImageToPhotosAlbum({ filePath, success: resolve, fail: reject }))
}

async function saveAll(paths, onProgress) {
  let saved = 0
  for (const filePath of paths || []) {
    try {
      await saveOne(filePath)
      saved++
      if (onProgress) onProgress(saved, paths.length)
    } catch (error) {
      const denied = /auth|deny|denied/i.test(error.errMsg || '')
      throw Object.assign(new Error(denied ? '相册权限未开启' : '图片保存失败'), { denied, saved, total: paths.length })
    }
  }
  return saved
}

module.exports = { saveAll }
