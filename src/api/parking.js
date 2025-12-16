import request from './request'

/**
 * 停车场闸机相关 API
 */
export default {
  /**
   * 获取所有停车场闸机配置
   * @param {Object} params - 查询参数
   * @param {string} [params.parkingLotId] - 按停车场ID过滤
   */
  getAll(params = {}) {
    return request.get('/parking-gates', params)
  },

  /**
   * 获取单个闸机详情
   * @param {string} id - 闸机ID
   */
  getById(id) {
    return request.get(`/parking-gates/${id}`)
  },

  /**
   * 创建新的停车场闸机配置
   * @param {Object} data - 闸机数据
   * @param {string} data.name - 名称
   * @param {number} data.x - X坐标
   * @param {number} data.y - Y坐标
   * @param {string} data.parkingLotId - 所属停车场ID
   */
  create(data) {
    return request.post('/parking-gates', data)
  },

  /**
   * 控制停车场闸机开关
   * @param {string} id - 闸机ID
   * @param {string} action - 动作: OPEN | CLOSE
   */
  control(id, action) {
    return request.post(`/parking-gates/${id}/control`, { action })
  },

  /**
   * 更新停车场闸机状态（硬件反馈）
   * @param {string} id - 闸机ID
   * @param {string} state - 状态: OPEN | CLOSED | OPENING | CLOSING
   */
  updateStatus(id, state) {
    return request.put(`/parking-gates/${id}/status`, { state })
  },

  /**
   * 删除停车场闸机配置
   * @param {string} id - 闸机ID
   */
  delete(id) {
    return request.delete(`/parking-gates/${id}`)
  }
}