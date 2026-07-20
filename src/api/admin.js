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
  return service.get('/knowledge/article/page', params)
}