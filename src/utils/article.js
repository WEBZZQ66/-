import { filebaseUrl } from '@/config/index'

//取第一个非空字段
export const pick = (obj, keys) => {
  if (!obj) return ''
  for (const key of keys) {
    const val = obj[key]
    if (val !== undefined && val !== null && val !== '') return val
  }
  return ''
}

//后端标题/摘要带首尾空格和换行，统一压成单行
export const clean = (val) => String(val ?? '').replace(/\s+/g, ' ').trim()

//封面是相对路径（/files/...），拼上文件服务器前缀
export const resolveCover = (path) => {
  if (typeof path !== 'string' || !path) return ''
  return /^https?:\/\//.test(path) ? path : `${filebaseUrl}${path}`
}

export const formatDate = (val) => {
  if (!val) return ''
  const date = new Date(typeof val === 'number' ? val : String(val).replace(/-/g, '/'))
  if (Number.isNaN(date.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

//标签有两种形态：tags 是逗号串，tagArray 是数组
const normalizeTags = (raw) => {
  const array = raw?.tagArray
  if (Array.isArray(array)) return array.filter(Boolean)
  return clean(raw?.tags)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

export const normalizeArticle = (raw) => ({
  id: pick(raw, ['id', 'articleId']),
  title: clean(pick(raw, ['title', 'articleTitle'])),
  summary: clean(pick(raw, ['summary', 'description', 'digest', 'intro', 'contentPreview', 'brief'])),
  category: clean(pick(raw, ['categoryName', 'category', 'categoryTitle'])),
  author: clean(pick(raw, ['authorName', 'author', 'createBy'])),
  tags: normalizeTags(raw),
  readCount: Number(pick(raw, ['readCount', 'views', 'viewCount']) || 0),
  isFavorited: Boolean(pick(raw, ['isFavorited', 'favorited'])),
  favoriteCount: Number(pick(raw, ['favoriteCount', 'favorites']) || 0),
  cover: resolveCover(pick(raw, ['coverImage', 'cover', 'coverUrl', 'image'])),
  timeText: formatDate(pick(raw, ['publishedAt', 'publishTime', 'publishAt', 'createTime', 'createdAt'])),
  content: pick(raw, ['content', 'contentText', 'html', 'articleContent'])
})
