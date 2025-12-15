import request from './request'

export default {
  /**
   * 获取所有道路配置
   */
  getAllRoads() {
    return request.get('/roads')
  },

  /**
   * 获取单条道路详情
   */
  getRoadById(id) {
    return request.get(`/roads/${id}`)
  },

  /**
   * 删除道路配置
   */
  deleteRoad(id) {
    return request.delete(`/roads/${id}`)
  },

  /**
   * 获取路网图
   */
  getRoadNetwork() {
    return request.get('/roads/network')
  },

  /**
   * 获取所有路段的拥堵概览
   */
  getCongestionOverview(level) {
    const params = level ? { level } : {}
    return request.get('/roads/congestion/overview', params)
  },

  /**
   * 获取指定路段的拥堵状态
   */
  getRoadCongestion(roadId) {
    return request.get(`/roads/${roadId}/congestion`)
  },

  /**
   * 获取路段历史拥堵趋势
   */
  getRoadCongestionHistory(roadId, hours = 24) {
    return request.get(`/roads/${roadId}/congestion/history`, { hours })
  }
}