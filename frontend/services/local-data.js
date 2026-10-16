const DRAFT_KEY = 'shangxintu:draft:v1'
const WORKS_KEY = 'shangxintu:works:v1'
const PREFERENCES_KEY = 'shangxintu:preferences:v1'
const MAX_WORKS = 6

function loadDraft() {
  try { return wx.getStorageSync(DRAFT_KEY) || null } catch { return null }
}

function saveDraft(draft) {
  try { wx.setStorageSync(DRAFT_KEY, draft); return true } catch { return false }
}

function clearDraft() {
  try { wx.removeStorageSync(DRAFT_KEY) } catch {}
}

function loadPreferences() {
  try { return wx.getStorageSync(PREFERENCES_KEY) || null } catch { return null }
}

function savePreferences(value) {
  try { wx.setStorageSync(PREFERENCES_KEY, value); return true } catch { return false }
}

function loadWorks() {
  try {
    const value = wx.getStorageSync(WORKS_KEY)
    return Array.isArray(value) ? value : []
  } catch { return [] }
}

function saveFile(tempFilePath) {
  return new Promise((resolve, reject) => wx.saveFile({ tempFilePath, success: result => resolve(result.savedFilePath), fail: reject }))
}

function removeFiles(paths) {
  const fs = wx.getFileSystemManager()
  for (const filePath of paths || []) fs.unlink({ filePath, fail() {} })
}

async function addWork({ draft, generation, outputs }) {
  const saved = []
  try {
    for (const output of outputs) saved.push(await saveFile(output))
  } catch (error) {
    removeFiles(saved)
    throw error
  }
  const works = loadWorks()
  const work = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: draft.name,
    modelNumber: draft.modelNumber || '',
    category: draft.category || '',
    price: draft.price,
    features: draft.features,
    promotionText: draft.promotionText || '',
    brandName: draft.brandName || '',
    brandColor: draft.brandColor || '#b53f00',
    sourcePath: draft.imagePath || '',
    templateId: generation.templateId,
    ratio: generation.ratio,
    imageScale: generation.imageScale || 1,
    imagePosition: generation.imagePosition || 'center',
    aiProcessed: Boolean(generation.aiProcessed),
    aiMode: generation.aiMode || (generation.aiProcessed ? 'cutout' : 'original'),
    sceneId: generation.sceneId || '',
    outputs: saved,
    createdAt: Date.now()
  }
  const next = [work, ...works]
  const removed = next.splice(MAX_WORKS)
  try { wx.setStorageSync(WORKS_KEY, next) } catch (error) { removeFiles(saved); throw error }
  removeFiles(removed.flatMap(item => item.outputs || []))
  return work
}

function removeWork(id) {
  const works = loadWorks()
  const target = works.find(item => item.id === id)
  const next = works.filter(item => item.id !== id)
  wx.setStorageSync(WORKS_KEY, next)
  if (target) removeFiles(target.outputs)
  return next
}

module.exports = { loadDraft, saveDraft, clearDraft, loadPreferences, savePreferences, loadWorks, addWork, removeWork, MAX_WORKS }
