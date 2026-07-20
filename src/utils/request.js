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
        ElMessage.error(data.message || "登录超时，请重新登录")
        localStorage.removeItem("token")
        localStorage.removeItem("userInfo")
        window.location.href = "/auth/login"
      }
      return Promise.reject(new Error(data.message || "登录超时"))
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