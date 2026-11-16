const THEME_KEY = 'theme'

export const getTheme = () => (localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light')

export const isDark = () => getTheme() === 'dark'

//给 <html> 加/去 dark 类，Element 的暗色变量也挂在同一个类上
const paint = (theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const initTheme = () => {
  paint(getTheme())
}

export const applyTheme = (theme) => {
  localStorage.setItem(THEME_KEY, theme)
  //切换瞬间关掉过渡，避免整页大面积渐变闪烁
  document.documentElement.classList.add('theme-switching')
  paint(theme)
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('theme-switching')
  })
}

export const toggleTheme = () => {
  const next = isDark() ? 'light' : 'dark'
  applyTheme(next)
  return next
}
