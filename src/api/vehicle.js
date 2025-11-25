import request from './request'

/**
 * 车辆模块 API
 */
export default {
  /**
   * 获取所有车辆实时位置
   * @returns {Promise}
   */
  getVehiclesRealtime() {
    return request.get('/vehicles/realtime')
  },

  /**
   * 获取单个车辆实时位置
   * @param {Number} vehicleId - 车辆ID
   * @returns {Promise}
   */
  getVehiclePosition(vehicleId) {
    return request.get(`/vehicles/${vehicleId}/position`)
  },

  /**
   * 获取车辆历史轨迹
   * @param {Number} vehicleId - 车辆ID
   * @param {Object} params - 查询参数 { startTime, endTime }
   * @returns {Promise}
   */
  getVehicleTrack(vehicleId, params) {
    return request.get(`/vehicles/${vehicleId}/track`, params)
  },

  /**
   * 获取车辆列表
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  getVehicleList(params) {
    return request.get('/vehicles', params)
  },

  /**
   * 获取车辆详情
   * @param {Number} vehicleId - 车辆ID
   * @returns {Promise}
   */
  getVehicleDetail(vehicleId) {
    return request.get(`/vehicles/${vehicleId}`)
  },
  /**
   * 获取当前用户的车辆信息（用户端）
   * @returns {Promise}
   */
  getMyVehicle() {
    return request.get('/user/vehicle')
  },

  /**
   * 获取当前用户车辆的实时位置（用户端）
   * @returns {Promise}
   */
  getMyVehiclePosition() {
    return request.get('/user/vehicle/position')
  }
}