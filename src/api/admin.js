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
export function createArticle(data) {
  return service.post('/knowledge/article', data)
}
export function getArticleDetail(id) {
  return service.get(`/knowledge/article/${id}`)
}