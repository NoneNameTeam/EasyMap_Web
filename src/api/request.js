import axios from 'axios'

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api', // API基础路径
  timeout: 15000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从本地存储获取 token
    const token = localStorage.getItem('token')
    
    // 如果 token 存在，添加到请求头
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    // 显示加载状态（可选）
    console.log('请求发送:', config.url)
    
    return config
  },
  error => {
    // 请求错误处理
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 获取响应数据
    const res = response.data
    
    // 根据后端返回的状态码进行处理
    // 这里假设后端返回格式为: { code: 200, data: {}, message: 'success' }
    if (res.code === 200 || res.code === 0) {
      return res.data
    } else {
      // 业务错误处理
      console.error('业务错误:', res.message)
      
      // 统一错误提示（后续可以接入 element-plus 的 Message 组件）
      alert(res.message || '请求失败')
      
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  error => {
    // HTTP 错误处理
    console.error('HTTP错误:', error)
    
    let message = '请求失败'
    
    if (error.response) {
      // 服务器返回错误状态码
      switch (error.response.status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          // 清除 token 并跳转到登录页
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
  /**
   * GET 请求
   * @param {string} url 请求地址
   * @param {object} params 请求参数
   * @param {object} config 额外配置
   */
  get(url, params = {}, config = {}) {
    return request({
      method: 'get',
      url,
      params,
      ...config
    })
  },

  /**
   * POST 请求
   * @param {string} url 请求地址
   * @param {object} data 请求数据
   * @param {object} config 额外配置
   */
  post(url, data = {}, config = {}) {
    return request({
      method: 'post',
      url,
      data,
      ...config
    })
  },

  /**
   * PUT 请求
   * @param {string} url 请求地址
   * @param {object} data 请求数据
   * @param {object} config 额外配置
   */
  put(url, data = {}, config = {}) {
    return request({
      method: 'put',
      url,
      data,
      ...config
    })
  },

  /**
   * DELETE 请求
   * @param {string} url 请求地址
   * @param {object} params 请求参数
   * @param {object} config 额外配置
   */
  delete(url, params = {}, config = {}) {
    return request({
      method: 'delete',
      url,
      params,
      ...config
    })
  },

  /**
   * 上传文件
   * @param {string} url 请求地址
   * @param {FormData} formData 表单数据
   */
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

  /**
   * 下载文件
   * @param {string} url 请求地址
   * @param {object} params 请求参数
   */
  download(url, params = {}) {
    return request({
      method: 'get',
      url,
      params,
      responseType: 'blob'
    })
  }
}