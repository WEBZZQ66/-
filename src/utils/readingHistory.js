//最近阅读：没有后端接口，先存本地
const KEY = 'readingHistory'
const MAX = 8

export const getHistory = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export const addHistory = (article) => {
  if (!article?.id) return
  const item = {
    id: article.id,
    title: article.title || '未命名文章',
    category: article.category || '',
    cover: article.cover || '',
    time: Date.now()
  }
  const rest = getHistory().filter(entry => entry.id !== item.id)
  localStorage.setItem(KEY, JSON.stringify([item, ...rest].slice(0, MAX)))
}

export const clearHistory = () => localStorage.removeItem(KEY)
