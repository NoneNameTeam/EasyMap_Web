import request from './request'

export default {
  /**
   * 计算最优路径
   * @param {Object} data - 路径规划参数
   * @param {number} data.startX - 起点X坐标
   * @param {number} data.startY - 起点Y坐标
   * @param {number} data.targetX - 终点X坐标
   * @param {number} data.targetY - 终点Y坐标
   * @param {boolean} [data.considerTraffic] - 是否考虑交通状况
   * @param {boolean} [data.avoidEvents] - 是否避开事件
   * @param {number} [data.preferredSpeed] - 偏好速度
   */
  calculateRoute(data) {
    return request.post('/pathfinding/route', data)
  },

  /**
   * 获取推荐路径
   */
  getRecommendedRoute(data) {
    return request.post('/pathfinding/recommended', data)
  },

  /**
   * 获取最短路径
   */
  getShortestRoute(data) {
    return request.post('/pathfinding/shortest', data)
  },

  /**
   * 基于关键点ID进行路径规划
   */
  calculateRouteByKeypoints(data) {
    return request.post('/pathfinding/keypoints', data)
  },

  /**
   * 批量路径规划
   */
  batchCalculate(routes) {
    return request.post('/pathfinding/batch', { routes })
  }
}