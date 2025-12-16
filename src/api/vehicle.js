import request from './request'

/**
 * 车辆模块 API
 */
export default {
  /**
   * 获取所有车辆当前位置（支持分页）
   * @param {Object} params - 查询参数 { type, limit, cursor }
   * @returns {Promise}
   */
  getVehicles(params) {
    return request.get('/vehicles', params)
  },

  /**
   * 注册新车辆
   * @param {Object} data - { type, currentX, currentY, speed, direction, distance, angle }
   * @returns {Promise}
   */
  createVehicle(data) {
    return request.post('/vehicles', data)
  },

  /**
   * 获取车辆统计信息
   * @returns {Promise}
   */
  getVehicleStats() {
    return request.get('/vehicles/stats')
  },

  /**
   * 获取单个车辆当前位置
   * @param {String} vehicleId - 车辆ID
   * @returns {Promise}
   */
  getVehicle(vehicleId) {
    return request.get(`/vehicles/${vehicleId}`)
  },

  /**
   * 获取车辆轨迹历史
   * @param {String} vehicleId - 车辆ID
   * @param {Object} params - { startTime, endTime, limit }
   * @returns {Promise}
   */
  getVehicleTrajectory(vehicleId, params) {
    return request.get(`/vehicles/${vehicleId}/trajectory`, params)
  },

  /**
   * 获取车辆最近的有效位置历史
   * @param {String} vehicleId - 车辆ID
   * @param {Object} params - { limit }
   * @returns {Promise}
   */
  getVehicleValidHistory(vehicleId, params) {
    return request.get(`/vehicles/${vehicleId}/history/valid`, params)
  },

  /**
   * 删除车辆及其历史数据
   * @param {String} vehicleId - 车辆ID
   * @returns {Promise}
   */
  deleteVehicle(vehicleId) {
    return request.delete(`/vehicles/${vehicleId}`)
  },

  /**
   * 获取指定区域内的车辆
   * @param {Object} params - { minX, maxX, minY, maxY } (必填)
   * @returns {Promise}
   */
  getVehiclesInArea(params) {
    return request.get('/vehicles/area/search', params)
  },

  /**
   * 清理旧的历史数据
   * @param {Object} params - { days } 保留天数，默认7天
   * @returns {Promise}
   */
  cleanHistory(params) {
    return request.delete('/vehicles/history/clean', params)
  }
}