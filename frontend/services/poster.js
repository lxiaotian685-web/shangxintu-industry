const themes = {
  'warm-life': { background: '#f4e7d8', paper: '#fffaf4', ink: '#44291f', accent: '#a33900', soft: '#e3b58f', light: '#f9f1e7', deep: '#7d2b0b', label: 'WARM STUDIO' },
  'clean-studio': { background: '#e9edf2', paper: '#ffffff', ink: '#111c2d', accent: '#263143', soft: '#b8c5d6', light: '#f7f9fb', deep: '#111827', label: 'CLEAN EDITION' },
  'season-sale': { background: '#8f2607', paper: '#fff1e8', ink: '#42190d', accent: '#ffcf5a', soft: '#dd6840', light: '#ffeadf', deep: '#5f1704', label: 'SEASON SALE' }
}

const layouts = {
  'warm-life': [
    { x: 72, y: 168, width: 936, bottom: 500 },
    { x: 60, y: 180, width: 570, bottom: 260 },
    { x: 390, y: 150, width: 630, bottom: 250 }
  ],
  'clean-studio': [
    { x: 170, y: 120, width: 846, bottom: 430 },
    { x: 150, y: 160, width: 520, bottom: 250 },
    { x: 430, y: 110, width: 586, bottom: 200 }
  ],
  'season-sale': [
    { x: 60, y: 210, width: 960, bottom: 540 },
    { x: 54, y: 220, width: 590, bottom: 300 },
    { x: 360, y: 190, width: 660, bottom: 290 }
  ]
}

function dimensions(ratio) {
  if (!['1:1', '3:4'].includes(ratio)) throw new Error('不支持的图片比例')
  return { width: 1080, height: ratio === '3:4' ? 1440 : 1080 }
}

function contain(width, height, box) {
  if (!(width > 0 && height > 0)) throw new Error('图片尺寸无效，请重新选图')
  const scale = Math.min(box.width / width, box.height / height)
  return { x: box.x + (box.width - width * scale) / 2, y: box.y + (box.height - height * scale) / 2, width: width * scale, height: height * scale }
}

function wrapText(ctx, text, maxWidth) {
  const lines = []
  let line = ''
  for (const char of Array.from(text || '')) {
    if (line && ctx.measureText(line + char).width > maxWidth) { lines.push(line); line = '' }
    line += char
  }
  if (line) lines.push(line)
  return lines
}

function fill(ctx, color, x, y, width, height) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, width, height)
}

function write(ctx, text, x, y, font, color, maxWidth) {
  ctx.font = font
  ctx.fillStyle = color
  ctx.fillText(text, x, y, maxWidth)
}

function writeLines(ctx, text, x, y, maxWidth, lineHeight, font, color) {
  ctx.font = font
  ctx.fillStyle = color
  for (const line of wrapText(ctx, text, maxWidth)) {
    ctx.fillText(line, x, y)
    y += lineHeight
  }
  return y
}

function drawBase(ctx, themeId, theme, width, height) {
  fill(ctx, theme.background, 0, 0, width, height)
  if (themeId === 'warm-life') {
    fill(ctx, theme.light, 24, 24, width - 48, height - 48)
    fill(ctx, theme.soft, width - 248, 0, 248, 108)
    fill(ctx, '#eed2bd', 0, height - 128, width, 128)
    fill(ctx, theme.accent, 0, height - 36, 220, 36)
    fill(ctx, theme.deep, 220, height - 36, 70, 36)
  } else if (themeId === 'clean-studio') {
    fill(ctx, theme.deep, 0, 0, 118, height)
    fill(ctx, '#738096', 118, 0, 6, height)
    fill(ctx, theme.light, 124, 24, width - 148, height - 48)
    for (let y = 132; y < height; y += 150) fill(ctx, '#d8e0e9', 124, y, width - 148, 2)
    fill(ctx, theme.soft, width - 96, 24, 72, 210)
  } else {
    fill(ctx, theme.deep, 22, 22, width - 44, height - 44)
    fill(ctx, theme.soft, 22, 22, width - 44, 92)
    fill(ctx, theme.accent, 22, 114, 250, 18)
    fill(ctx, '#b84018', width - 210, 114, 188, height - 136)
    fill(ctx, theme.accent, 22, height - 82, width - 44, 60)
  }
  ctx.textBaseline = 'top'
  write(ctx, theme.label, themeId === 'clean-studio' ? 132 : 54, themeId === 'season-sale' ? 22 : 42, 'bold 25px sans-serif', themeId === 'season-sale' ? theme.ink : theme.accent, 500)
}

function drawBackdrop(ctx, themeId, theme, box, variant) {
  const lower = box.y + Math.round(box.height * 0.7)
  if (themeId === 'warm-life') {
    fill(ctx, '#f8efe5', box.x, box.y, box.width, box.height)
    fill(ctx, '#fffaf5', box.x + 32, box.y, Math.max(54, box.width * 0.17), box.height * 0.58)
    fill(ctx, '#efd6c1', box.x + box.width - 120, box.y + 28, 84, box.height * 0.45)
    fill(ctx, '#dfb792', box.x, lower, box.width, box.y + box.height - lower)
    fill(ctx, 'rgba(85,45,25,0.13)', box.x + box.width * 0.18, lower + 34, box.width * 0.64, 24)
    fill(ctx, '#f3d9c2', box.x + box.width * 0.12, lower - 8, box.width * 0.76, 18)
  } else if (themeId === 'clean-studio') {
    fill(ctx, '#f4f6f9', box.x, box.y, box.width, box.height)
    fill(ctx, '#dce3eb', box.x, box.y, box.width * 0.28, box.height)
    fill(ctx, '#ffffff', box.x + box.width * 0.28, box.y, box.width * 0.72, box.height * 0.7)
    for (let x = box.x + 28; x < box.x + box.width; x += 90) fill(ctx, '#e5eaf0', x, box.y, 2, box.height)
    fill(ctx, '#c7d0db', box.x, lower, box.width, box.y + box.height - lower)
    fill(ctx, 'rgba(22,32,48,0.13)', box.x + box.width * 0.2, lower + 30, box.width * 0.6, 20)
  } else {
    fill(ctx, '#7f2106', box.x, box.y, box.width, box.height)
    fill(ctx, '#b83c14', box.x + box.width * 0.58, box.y, box.width * 0.42, box.height)
    fill(ctx, '#f26c32', box.x, box.y + 30, box.width * 0.22, box.height * 0.5)
    fill(ctx, '#6b1904', box.x, lower, box.width, box.y + box.height - lower)
    fill(ctx, 'rgba(0,0,0,0.2)', box.x + box.width * 0.16, lower + 34, box.width * 0.68, 24)
    fill(ctx, theme.accent, box.x + 24, box.y + 24, variant === 2 ? 150 : 72, 12)
  }
}

function drawPhoto(ctx, image, box, themeId, theme, variant, scale = 1, position = 'center') {
  ctx.save()
  ctx.shadowColor = 'rgba(40, 26, 20, 0.2)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 16
  fill(ctx, theme.paper, box.x - 12, box.y - 12, box.width + 24, box.height + 24)
  ctx.restore()
  drawBackdrop(ctx, themeId, theme, box, variant)
  const rect = contain(image.width, image.height, box)
  const [vertical, horizontal] = position === 'center' ? ['center', 'center'] : position.includes('-') ? position.split('-') : ['top', 'bottom'].includes(position) ? [position, 'center'] : ['center', position]
  const factorX = horizontal === 'left' ? 0 : horizontal === 'right' ? 1 : 0.5
  const factorY = vertical === 'top' ? 0 : vertical === 'bottom' ? 1 : 0.5
  const width = rect.width * scale, height = rect.height * scale
  const scaled = { x: box.x + (box.width - width) * factorX, y: box.y + (box.height - height) * factorY, width, height }
  ctx.save()
  ctx.beginPath()
  ctx.rect(box.x, box.y, box.width, box.height)
  ctx.clip()
  ctx.shadowColor = 'rgba(50, 32, 24, 0.18)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 14
  ctx.drawImage(image, scaled.x, scaled.y, scaled.width, scaled.height)
  ctx.restore()
  return scaled
}

function drawMain(ctx, image, product, themeId, theme, box, height) {
  if (themeId === 'warm-life') fill(ctx, theme.soft, box.x - 32, box.y - 32, 280, 98)
  if (themeId === 'season-sale') {
    fill(ctx, theme.accent, 58, 142, 168, 52)
    write(ctx, 'NEW DROP', 74, 153, 'bold 22px sans-serif', theme.ink, 140)
  }
  drawPhoto(ctx, image, box, themeId, theme, 0, product.imageScale, product.imagePosition)
  let y = box.y + box.height + 30
  const x = themeId === 'clean-studio' ? 150 : 64
  fill(ctx, themeId === 'season-sale' ? theme.soft : theme.accent, x, y - 2, 88, 8)
  y += 24
  y = writeLines(ctx, product.productName, x, y, 900, 58, 'bold 48px sans-serif', themeId === 'season-sale' ? '#ffffff' : theme.ink)
  if (product.price) {
    const priceColor = themeId === 'season-sale' ? theme.accent : theme.accent
    write(ctx, `¥ ${product.price}`, x, y + 8, 'bold 48px sans-serif', priceColor, 500)
  }
  write(ctx, '商品主图 · PRODUCT COVER', x, height - 78, '24px sans-serif', themeId === 'season-sale' ? '#ffffff' : theme.accent, 600)
}

function drawDetails(ctx, image, product, themeId, theme, box, height) {
  drawPhoto(ctx, image, box, themeId, theme, 1, product.imageScale, product.imagePosition)
  const x = box.x + box.width + 46
  const maxWidth = 1080 - x - 48
  fill(ctx, themeId === 'season-sale' ? '#6b1904' : theme.paper, x - 20, box.y - 22, maxWidth + 36, Math.min(520, height - box.y - 120))
  write(ctx, 'DETAILS', x, box.y, 'bold 26px sans-serif', themeId === 'season-sale' ? theme.accent : theme.accent, maxWidth)
  let y = writeLines(ctx, product.productName, x, box.y + 54, maxWidth, 52, 'bold 40px sans-serif', themeId === 'season-sale' ? '#ffffff' : theme.ink)
  const features = product.features && product.features.length ? product.features : ['补充商品卖点，让顾客更快了解它']
  features.forEach((feature, index) => {
    fill(ctx, themeId === 'season-sale' ? theme.accent : theme.soft, x, y + 20, 42, 42)
    write(ctx, `0${index + 1}`, x + 7, y + 28, 'bold 18px sans-serif', theme.ink, 34)
    y = writeLines(ctx, feature, x + 58, y + 22, maxWidth - 58, 38, '28px sans-serif', themeId === 'season-sale' ? '#ffffff' : theme.ink)
    y += 20
  })
  write(ctx, '卖点图 · KEY FEATURES', x, height - 78, '24px sans-serif', themeId === 'season-sale' ? '#ffffff' : theme.accent, maxWidth)
}

function drawSale(ctx, image, product, themeId, theme, box, height) {
  drawPhoto(ctx, image, box, themeId, theme, 2, product.imageScale, product.imagePosition)
  const x = themeId === 'clean-studio' ? 142 : 58
  const maxWidth = box.x - x - 42
  fill(ctx, themeId === 'season-sale' ? '#6b1904' : theme.paper, x - 18, 150, maxWidth + 32, Math.min(450, height - 310))
  write(ctx, themeId === 'season-sale' ? '限时上新' : 'NEW DROP', x, 170, 'bold 27px sans-serif', themeId === 'season-sale' ? theme.accent : theme.accent, maxWidth)
  let y = writeLines(ctx, product.productName, x, 225, maxWidth, 50, 'bold 40px sans-serif', themeId === 'season-sale' ? '#ffffff' : theme.ink)
  y += 36
  if (product.price) {
    write(ctx, '上新价', x, y, '24px sans-serif', themeId === 'season-sale' ? '#ffe6d9' : theme.ink, maxWidth)
    write(ctx, `¥${product.price}`, x, y + 42, 'bold 62px sans-serif', themeId === 'season-sale' ? theme.accent : theme.accent, maxWidth)
  } else {
    write(ctx, '欢迎咨询', x, y, 'bold 40px sans-serif', themeId === 'season-sale' ? theme.accent : theme.accent, maxWidth)
  }
  fill(ctx, themeId === 'season-sale' ? theme.accent : theme.accent, x, height - 150, maxWidth, 58)
  write(ctx, `${product.promotionText || '立即了解'}  →`, x + 20, height - 136, 'bold 24px sans-serif', themeId === 'season-sale' ? theme.ink : '#ffffff', maxWidth - 40)
  write(ctx, '促销图 · PROMOTION', x, height - 78, '22px sans-serif', themeId === 'season-sale' ? '#ffffff' : theme.accent, maxWidth)
}

function drawPoster(ctx, image, product, variant) {
  const size = dimensions(product.ratio)
  const theme = themes[product.templateId]
  const layout = layouts[product.templateId] && layouts[product.templateId][variant]
  if (!theme || !layout || ![0, 1, 2].includes(variant)) throw new Error('模板或图片用途无效')
  const photoBox = { x: layout.x, y: layout.y, width: layout.width, height: size.height - layout.y - layout.bottom }
  drawBase(ctx, product.templateId, theme, size.width, size.height)
  if (variant === 0) drawMain(ctx, image, product, product.templateId, theme, photoBox, size.height)
  if (variant === 1) drawDetails(ctx, image, product, product.templateId, theme, photoBox, size.height)
  if (variant === 2) drawSale(ctx, image, product, product.templateId, theme, photoBox, size.height)
  if (product.brandName) {
    const textWidth = Math.min(330, ctx.measureText(product.brandName).width + 42)
    fill(ctx, product.brandColor || '#b53f00', size.width - textWidth - 30, 26, textWidth, 48)
    write(ctx, product.brandName, size.width - textWidth - 9, 36, 'bold 22px sans-serif', '#ffffff', textWidth - 24)
  }
  return { ...size, templateId: product.templateId, variant, photoBox }
}

module.exports = { dimensions, contain, wrapText, drawPoster }
