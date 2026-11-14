import service from '@/utils/request'
// 获取用户列表
export function login(data) {
  return service.post('/user/login', data)
}
//获取分类
export function categoryTree() {
  return service.get('/knowledge/category/tree') //由于后端接口没有参数所以不需要传参
}
export function articlePage(params) {
  return service.get('/knowledge/article/page', { params })
}
export function uploadFile(file, businessInfo) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('businessType', 'ARTICLE')
  formData.append('businessId', businessInfo.businessId)
  formData.append('businessField', 'cover')

  return service.post('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
//创建文章
export function createArticle(data) {
  return service.post('/knowledge/article', data)
}
//更新文章
export function updateArticle(id, data) {
  return service.put(`/knowledge/article/${id}`, data)
}
//发布/下线文章（status: 1 已发布，2 已下线）
export function updateArticleStatus(id, status) {
  return service.put(`/knowledge/article/${id}/status`, { status })
}
//获取文章详情
export function getArticleDetail(id) {
  return service.get(`/knowledge/article/${id}`)
}
//分页查询咨询会话
export function sessionPage(params) {
  return service.get('/psychological-chat/sessions', { params })
}
//获取会话消息列表
export function sessionMessages(sessionId) {
  return service.get(`/psychological-chat/sessions/${sessionId}/messages`)
}
//分页查询情绪日记
export function emotionDiaryPage(params) {
  return service.get('/emotion-diary/admin/page', { params })
}
//删除情绪日记
export function deleteEmotionDiary(id) {
  return service.delete(`/emotion-diary/admin/${id}`)
}
//删除文章
export function deleteArticle(id) {
  return service.delete(`/knowledge/article/${id}`)
}