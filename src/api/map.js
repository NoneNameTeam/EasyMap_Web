import request from './request'

/**
 * 地图模块 API
 */
export default {
  /**
   * 获取地图数据
   * @param {Object} params - 查询参数 { block, roadId }
   * @returns {Promise} 返回地图块数据数组
   */
  getMapData(params = {}) {
    return request.get('/maps/data', params)
  },

  /**
   * 按坐标检索地图数据
   * @param {Number} x - X坐标
   * @param {Number} y - Y坐标
   * @returns {Promise}
   */
  getMapByCoord(x, y) {
    return request.get(`/maps/${x}/${y}`)
  },

  /**
   * 创建新的地图数据
   * @param {Object} data - 地图块数据
   * @returns {Promise}
   */
  createMapBlock(data) {
    return request.post('/maps/data', data)
  },

  /**
   * 更新现有地图数据
   * @param {String} id - 地图节点ID (UUID)
   * @param {Object} data - 更新数据
   * @returns {Promise}
   */
  updateMapBlock(id, data) {
    return request.put(`/maps/data/${id}`, data)
  },

  /**
   * 按区块类型过滤
   * @param {String} blockType - BUILDING/ROAD/WATER
   * @returns {Promise}
   */
  getMapByBlockType(blockType) {
    return request.get('/maps/data', { block: blockType })
  },

  /**
   * 按道路ID过滤
   * @param {String} roadId - 道路ID
   * @returns {Promise}
   */
  getMapByRoadId(roadId) {
    return request.get('/maps/data', { roadId: roadId })
  },

  /**
   * 检查服务器健康状态
   * @returns {Promise}
   */
  checkHealth() {
    return request.get('/health')
  }
}