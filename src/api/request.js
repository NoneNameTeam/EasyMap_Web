import axios from 'axios'

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 60000,  // ✅ 增加到 60 秒（处理大数据量）
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    console.log('请求发送:', config.url)
    
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    
    // ✅ 处理两种不同的响应格式
    
    // 格式1: 直接返回数据（如健康检查）
    // { status: 'ok', timestamp: 123456 }
    if (res.status !== undefined || res.timestamp !== undefined) {
      console.log('📥 直接格式响应:', res)
      return res
    }
    
    // 格式2: 包装格式
    // { code: 200, message: 'Success', data: {...} }
    if (res.code !== undefined) {
      if (res.code === 200) {
        console.log('📥 包装格式响应 - 成功:', res.data)
        return res.data  // ✅ 返回 data 字段
      } else {
        console.error('📥 包装格式响应 - 业务错误:', res)
        const errorMessage = res.message || '请求失败'
        alert(errorMessage)
        return Promise.reject(new Error(errorMessage))
      }
    }
    
    // 格式3: 其他格式（如分页数据）
    // { items: [...], nextCursor: '...', hasNextPage: true }
    console.log('📥 其他格式响应:', res)
    return res
  },
  error => {
    console.error('HTTP错误:', error)
    
    let message = '请求失败'
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          localStorage.removeItem('token')
          window.location.href = '/'
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        case 504:
          message = '网关超时'
          break
        default:
          message = `连接错误 ${error.response.status}`
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时'
    } else if (error.message.includes('Network Error')) {
      message = '网络连接异常'
    }
    
    alert(message)
    return Promise.reject(error)
  }
)

// 封装常用请求方法
export default {
  get(url, params = {}, config = {}) {
    return request({
      method: 'get',
      url,
      params,
      ...config
    })
  },

  post(url, data = {}, config = {}) {
    return request({
      method: 'post',
      url,
      data,
      ...config
    })
  },

  put(url, data = {}, config = {}) {
    return request({
      method: 'put',
      url,
      data,
      ...config
    })
  },

  delete(url, params = {}, config = {}) {
    return request({
      method: 'delete',
      url,
      params,
      ...config
    })
  },

  upload(url, formData) {
    return request({
      method: 'post',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  download(url, params = {}) {
    return request({
      method: 'get',
      url,
      params,
      responseType: 'blob'
    })
  }
}