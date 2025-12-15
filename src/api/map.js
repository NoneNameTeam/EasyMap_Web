import request from './request'

/**
 * 地图模块 API
 */
export default {
  /**
   * 获取地图数据（单页）
   * @param {Object} params - 查询参数 { block, roadId, cursor, limit }
   * @returns {Promise}
   */
  getMapData(params = {}) {
    return request.get('/maps/data', params)
  },

  /**
   * 获取所有地图数据（自动处理分页）- 优化版
   * @param {Object} filters - 过滤参数 { block, roadId }
   * @param {Function} onProgress - 进度回调 (loadedCount, totalEstimate)
   * @returns {Promise<Array>} 返回所有地图块数组
   */
  async getAllMapData(filters = {}, onProgress = null) {
    let allItems = []
    let cursor = null
    let hasNextPage = true
    let pageCount = 0
    
    console.log(' 开始加载地图数据...')
    
    try {
      while (hasNextPage) {
        pageCount++
        
        const params = {
          ...filters,
          limit: 1000,
          ...(cursor && { cursor })
        }
        
        console.log(`📦 正在加载第 ${pageCount} 页，cursor:`, cursor)
        
        const response = await request.get('/maps/data', params)
        
        console.log(`✅ 第 ${pageCount} 页响应:`, response)
        
        // ✅ 响应拦截器已经解包，这里直接使用
        // response 格式: { items: [...], nextCursor: '...', hasNextPage: true }
        
        if (!response || typeof response !== 'object') {
          console.error('❌ 响应格式错误:', response)
          break
        }
        
        const items = response.items || []
        
        console.log(` 第 ${pageCount} 页数据:`, {
          itemsCount: items.length,
          nextCursor: response.nextCursor,
          hasNextPage: response.hasNextPage
        })
        
        if (items.length === 0 && pageCount === 1) {
          console.warn(' 第一页没有数据')
          break
        }
        
        allItems = allItems.concat(items)
        cursor = response.nextCursor
        hasNextPage = response.hasNextPage === true
        
        // 调用进度回调
        if (onProgress && typeof onProgress === 'function') {
          onProgress(allItems.length, hasNextPage, pageCount)
        }
        
        console.log(` 当前总数: ${allItems.length}，是否有下一页: ${hasNextPage}`)
        
        // 安全检查：防止无限循环
        if (pageCount > 1000) {
          console.warn(' 达到最大页数限制，停止加载')
          break
        }
        
        // 如果没有下一页或没有 cursor，停止
        if (!hasNextPage || !cursor) {
          console.log(' 所有数据加载完成')
          break
        }
      }
      
      console.log(` 加载完成！共 ${pageCount} 页，总计 ${allItems.length} 条数据`)
      return allItems
      
    } catch (error) {
      console.error(' 加载地图数据失败:', error)
      throw error
    }
  },

  /**
   * 按坐标检索地图数据
   */
  getMapByCoord(x, y) {
    return request.get(`/maps/${x}/${y}`)
  },

  /**
   * 创建新的地图数据
   */
  createMapBlock(data) {
    return request.post('/maps/data', data)
  },

  /**
   * 更新现有地图数据
   */
  updateMapBlock(id, data) {
    return request.put(`/maps/data/${id}`, data)
  },

  /**
   * 获取对象列表
   */
  getObjects(params = {}) {
    return request.get('/objects', params)
  },

  /**
   * 创建新的对象列表
   */
  createObject(data) {
    return request.put('/objects', data)
  },

  /**
   * 向对象添加节点
   */
  addNodeToObject(objectId, data) {
    return request.post(`/objects/${objectId}/nodes`, data)
  },

  /**
   * 检查服务器健康状态
   */
  checkHealth() {
    return request.get('/health')
  }
}