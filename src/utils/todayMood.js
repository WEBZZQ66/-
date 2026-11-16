//今日情绪：情绪日记保存后写在本地，供聊天页的情绪花园展示
const KEY = 'todayMood'

const today = () => {
  const date = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const moodMeta = (score) => {
  if (score >= 80) return { label: '很开心', icon: '😄' }
  if (score >= 60) return { label: '还不错', icon: '🙂' }
  if (score >= 40) return { label: '一般', icon: '😐' }
  if (score >= 20) return { label: '有点低落', icon: '😕' }
  return { label: '很低落', icon: '😞' }
}

export const getTodayMood = () => {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!data || data.date !== today()) return null
    return data
  } catch {
    return null
  }
}

//moodScore 是 1-10，这里换算成 0-100 方便情绪环展示
export const saveTodayMood = ({ diaryDate, moodScore, dominantEmotion, suggestion }) => {
  const score = Math.max(0, Math.min(100, Math.round(Number(moodScore || 0) * 10)))
  const meta = moodMeta(score)
  const data = {
    date: diaryDate || today(),
    score,
    label: dominantEmotion || meta.label,
    icon: meta.icon,
    today: meta.label,
    tip: suggestion || '记录本身就是一种照顾自己的方式'
  }
  localStorage.setItem(KEY, JSON.stringify(data))
  return data
}
