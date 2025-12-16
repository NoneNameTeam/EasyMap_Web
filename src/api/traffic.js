import request from './request'

/**
 * 交通灯相关 API
 */
export default {
  /**
   * 获取所有交通灯配置
   * @param {Object} params - 查询参数
   * @param {string} [params.roadId] - 按道路ID过滤
   */
  getAll(params = {}) {
    return request.get('/traffic-lights', params)
  },

  /**
   * 获取单个交通灯详情
   * @param {string} id - 交通灯ID
   */
  getById(id) {
    return request.get(`/traffic-lights/${id}`)
  },

  /**
   * 创建新的交通灯配置
   * @param {Object} data - 交通灯数据
   * @param {string} data.name - 名称
   * @param {number} data.x - X坐标
   * @param {number} data.y - Y坐标
   * @param {string} data.roadId - 所属道路ID
   * @param {number} data.duration - 持续时间（秒）
   */
  create(data) {
    return request.post('/traffic-lights', data)
  },

  /**
   * 更新交通灯状态
   * @param {string} id - 交通灯ID
   * @param {Object} data - 状态数据
   * @param {string} data.state - 状态: RED | YELLOW | GREEN
   * @param {number} [data.duration] - 持续时间（秒）
   */
  updateState(id, data) {
    return request.put(`/traffic-lights/${id}/state`, data)
  },

  /**
   * 删除交通灯配置
   * @param {string} id - 交通灯ID
   */
  delete(id) {
    return request.delete(`/traffic-lights/${id}`)
  },

  /**
   * 批量更新交通灯状态
   * @param {Array} updates - 更新列表
   * @param {string} updates[].id - 交通灯ID
   * @param {string} updates[].state - 状态
   * @param {number} [updates[].duration] - 持续时间
   */
  batchUpdate(updates) {
    return request.post('/traffic-lights/batch', { updates })
  }
}