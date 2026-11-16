//文章收藏：后端暂时没有收藏接口，先存本地
//接上接口后，把 toggleFavorite 内部换成请求即可，页面不用改
const KEY = 'favoriteArticles'
const MAX = 50

export const getFavorites = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export const isFavorited = (id) => getFavorites().some(item => String(item.id) === String(id))

//切换收藏状态，返回切换后的结果
export const toggleFavorite = (article) => {
  if (!article?.id) return false
  const list = getFavorites()
  const exists = list.some(item => String(item.id) === String(article.id))

  if (exists) {
    localStorage.setItem(KEY, JSON.stringify(list.filter(item => String(item.id) !== String(article.id))))
    return false
  }

  const entry = {
    id: article.id,
    title: article.title || '未命名文章',
    cover: article.cover || '',
    category: article.category || '',
    time: Date.now()
  }
  localStorage.setItem(KEY, JSON.stringify([entry, ...list].slice(0, MAX)))
  return true
}
