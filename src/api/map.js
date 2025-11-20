import request from './request'

/**
 * 地图模块 API
 */
export default {
  /**
   * 获取地图数据
   * @returns {Promise} 返回地图块数据数组
   */
  getMapData() {
    return request.get('/map/data')
  },

  /**
   * 获取指定区域的地图数据
   * @param {Object} params - 查询参数 { x1, y1, x2, y2 }
   * @returns {Promise}
   */
  getMapRegion(params) {
    return request.get('/map/region', params)
  },

  /**
   * 更新地图块信息
   * @param {Number} blockId - 地图块ID
   * @param {Object} data - 更新数据 { type, data }
   * @returns {Promise}
   */
  updateMapBlock(blockId, data) {
    return request.put(`/map/block/${blockId}`, data)
  },

  /**
   * 批量更新地图块
   * @param {Array} blocks - 地图块数组
   * @returns {Promise}
   */
  batchUpdateBlocks(blocks) {
    return request.post('/map/batch-update', { blocks })
  },

  /**
   * 获取地图配置信息
   * @returns {Promise}
   */
  getMapConfig() {
    return request.get('/map/config')
  }
}