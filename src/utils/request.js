import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建一个axios实例
const service = axios.create({
  baseURL: '/api', //请求的前缀
  timeout: 5000 //请求的超时时间
})
// 请求拦截器
service.interceptors.request.use(
  config => {
    //在发送请求前做些什么
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['token'] = token
    }
    return config
  },
  error => {
    //对请求错误做些什么
    return Promise.reject(error)
  }
)
// 响应拦截器
service.interceptors.response.use(
  (response) => {
    //对响应数据做点什么  
    const { data, config } = response
    //处理业务状态码
    if (data.code === "200") {
      return data.data
    } else if (data.code === "-1") {
      //登陆超时
      if (!config.url?.includes("/login")) {
        console.warn('[request] 登录态失效：', config.url, data)
        if (config.skipAuthRedirect) {
          //个别页面（如用户端咨询页）希望自己处理失败，不把用户整体踢出去
          if (!config.silentError) {
            ElMessage.error(data.msg || data.message || "请求失败")
          }
        } else {
          ElMessage.error(data.msg || data.message || "登录超时，请重新登录")
          localStorage.removeItem("token")
          localStorage.removeItem("userInfo")
          //记住当前页面，重新登录后能回到原处，而不是统一回首页
          const current = window.location.pathname + window.location.search
          const redirect = current.startsWith("/auth") ? "" : `?redirect=${encodeURIComponent(current)}`
          window.location.href = `/auth/login${redirect}`
        }
      }
      return Promise.reject(new Error(data.msg || data.message || "登录超时"))
    } else {
      ElMessage.error(data.message || "请求失败")
      return Promise.reject(new Error(data.message || "请求失败"))
    }

    // return response
  },
  error => {
    //对响应错误做点什么
    return Promise.reject(error)
  })
export default service