<template>
  <div class="admin-dashboard">
    <div class="sidebar">
      <div class="logo">
        <h2>管理者控制台</h2>
      </div>
      <nav class="nav-menu">
        <div 
          class="nav-item" 
          :class="{ active: currentTab === 'overview' }" 
          @click="switchTab('overview')"
        >
          数据总览
        </div>
        <!-- <div class="nav-item">车辆管理</div>
        <div class="nav-item">运载管理</div> -->
        <div 
          class="nav-item" 
          :class="{ active: currentTab === 'settings' }" 
          @click="switchTab('settings')"
        >
          系统设置
        </div>
      </nav>
      <button class="back-btn" @click="goBack">返回首页</button>
    </div>

    <div class="main-content">
      <header class="top-bar">
        <h1>管理者仪表盘</h1>
        <div class="user-info">管理员</div>
      </header>

      <div class="content-area">
        <!-- 数据总览 - 包含地图 -->
        <div v-if="currentTab === 'overview'" class="overview-section">
          <div class="section-header">
            <h2>交通实时监控</h2>
            <div class="map-controls">
              <button @click="showDebug = !showDebug" class="control-btn">
                {{ showDebug ? '隐藏' : '显示' }}坐标
              </button>
              <button @click="resetMap" class="control-btn">
                重置地图
              </button>
            </div>
          </div>

          <!-- 图例 -->
          <div class="legend">
            <div class="legend-title">图例:</div>
            <div class="legend-item">
              <span class="legend-color" style="background: #27ae60; opacity: 0.4;"></span>
              <span>畅通</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #95a5a6; opacity: 0.3;"></span>
              <span>正常</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #e74c3c; opacity: 0.5;"></span>
              <span>拥堵</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #e67e22; opacity: 0.7;"></span>
              <span>事故</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #f39c12; opacity: 0.6;"></span>
              <span>施工</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #34495e; opacity: 0.8;"></span>
              <span>建筑</span>
            </div>
          </div>

          <!-- 地图容器 -->
          <div class="map-wrapper">
            <MapContainer
              :width="mapWidth"
              :height="mapHeight"
              :block-size="blockSize"
              :blocks="mapBlocks"
              :show-debug="showDebug"
              @block-click="handleBlockClick"
              @block-hover="handleBlockHover"
            />
          </div>

          <!-- 统计信息 -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">🚗</div>
              <div class="stat-info">
                <h3>畅通路段</h3>
                <p class="stat-number">{{ trafficStats.smooth }}</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🟡</div>
              <div class="stat-info">
                <h3>正常路段</h3>
                <p class="stat-number">{{ trafficStats.normal }}</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🔴</div>
              <div class="stat-info">
                <h3>拥堵路段</h3>
                <p class="stat-number">{{ trafficStats.congested }}</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⚠️</div>
              <div class="stat-info">
                <h3>事故/施工</h3>
                <p class="stat-number">{{ trafficStats.accident + trafficStats.construction }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 系统设置 -->
        <div v-if="currentTab === 'settings'" class="settings-section">
          <h2>系统设置</h2>
          <div class="settings-content">
            <div class="setting-group">
              <h3>地图配置</h3>
              <div class="setting-item">
                <label>地图宽度（块）:</label>
                <input v-model.number="mapWidth" type="number" min="10" max="30" />
              </div>
              <div class="setting-item">
                <label>地图高度（块）:</label>
                <input v-model.number="mapHeight" type="number" min="10" max="30" />
              </div>
              <div class="setting-item">
                <label>块大小（像素）:</label>
                <input v-model.number="blockSize" type="number" min="30" max="100" step="10" />
              </div>
              <button @click="applySettings" class="apply-btn">应用设置</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 点击信息弹窗 -->
    <div v-if="selectedBlock" class="modal-overlay" @click="selectedBlock = null">
      <div class="modal-content" @click.stop>
        <h3>区域详细信息</h3>
        <div class="modal-body">
          <p><strong>类型:</strong> {{ getBlockTypeName(selectedBlock.type) }}</p>
          <p><strong>坐标:</strong> ({{ selectedBlock.x }}, {{ selectedBlock.y }})</p>
          <p v-if="selectedBlock.data.name">
            <strong>名称:</strong> {{ selectedBlock.data.name }}
          </p>
          <p v-if="selectedBlock.data.speed !== undefined">
            <strong>通行速度:</strong> {{ selectedBlock.data.speed }} km/h
          </p>
          <p v-if="selectedBlock.type === 'congested'">
            <strong>状态:</strong> <span style="color: #e74c3c;">拥堵中</span>
          </p>
          <p v-if="selectedBlock.type === 'accident'">
            <strong>状态:</strong> <span style="color: #e67e22;">发生事故</span>
          </p>
          <p v-if="selectedBlock.type === 'construction'">
            <strong>状态:</strong> <span style="color: #f39c12;">施工中</span>
          </p>
        </div>
        <button @click="selectedBlock = null" class="close-btn">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MapContainer from '../components/map/MapContainer.vue'

const router = useRouter()

// 当前选中的标签
const currentTab = ref('overview')

// 地图配置
const mapWidth = ref(20)
const mapHeight = ref(15)
const blockSize = ref(50)
const showDebug = ref(false)

// 地图块数据
const mapBlocks = ref([])

// 选中的块
const selectedBlock = ref(null)

// 切换标签
const switchTab = (tab) => {
  currentTab.value = tab
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 初始化地图
const initMap = () => {
  const blocks = []
  
  // 创建初始地图布局
  for (let y = 0; y < mapHeight.value; y++) {
    for (let x = 0; x < mapWidth.value; x++) {
      let type = 'empty'
      let data = {}
      
      // // 建筑物区域（四个角落）
      // if ((x < 3 || x > 16) && (y < 3 || y > 11)) {
      //   type = 'building'
      //   data = { name: `建筑物 ${x}-${y}` }
      // }
      // // 主要道路 - 横向
      // else if (x >= 5 && x <= 14 && (y === 7 || y === 8)) {
      //   type = 'normal'
      //   data = { name: '东西主干道', speed: 60 }
      // }
      // // 主要道路 - 纵向
      // else if (y >= 5 && y <= 10 && (x === 9 || x === 10)) {
      //   type = 'normal'
      //   data = { name: '南北主干道', speed: 60 }
      // }
      // // 次要道路 - 横向
      // else if (x >= 3 && x <= 16 && (y === 4 || y === 11)) {
      //   type = 'normal'
      //   data = { name: '次干道', speed: 40 }
      // }
      // // 次要道路 - 纵向
      // else if (y >= 3 && y <= 12 && (x === 5 || x === 14)) {
      //   type = 'normal'
      //   data = { name: '次干道', speed: 40 }
      // }
      
      if (type !== 'empty') {
        blocks.push({ x, y, type, data })
      }
    }
  }
  
  mapBlocks.value = blocks
}

// 重置地图
const resetMap = () => {
  initMap()
  selectedBlock.value = null
}

// 应用设置
const applySettings = () => {
  initMap()
  alert('设置已应用')
}

// 块点击处理
const handleBlockClick = (blockInfo) => {
  selectedBlock.value = blockInfo
}

// 块悬停处理
const handleBlockHover = (blockInfo) => {
  // console.log('悬停:', blockInfo)
}

// 获取块类型名称
const getBlockTypeName = (type) => {
  const names = {
    empty: '空白区域',
    building: '建筑物',
    normal: '普通道路',
    smooth: '畅通道路',
    congested: '拥堵路段',
    accident: '事故区域',
    construction: '施工区域'
  }
  return names[type] || type
}

// 计算交通统计
const trafficStats = computed(() => {
  const stats = {
    smooth: 0,
    normal: 0,
    congested: 0,
    accident: 0,
    construction: 0,
    building: 0
  }
  
  mapBlocks.value.forEach(block => {
    if (stats[block.type] !== undefined) {
      stats[block.type]++
    }
  })
  
  return stats
})

// 页面加载时初始化
onMounted(() => {
  initMap()
})
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
}

.sidebar {
  width: 250px;
  background: #2c3e50;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.logo h2 {
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #34495e;
}

.nav-menu {
  flex: 1;
}

.nav-item {
  padding: 15px 20px;
  margin-bottom: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.nav-item:hover,
.nav-item.active {
  background: #34495e;
}

.back-btn {
  padding: 12px;
  background: #3498db;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 1rem;
}

.back-btn:hover {
  background: #2980b9;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.top-bar {
  background: white;
  padding: 20px 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-area {
  padding: 30px;
  flex: 1;
  overflow-y: auto;
}

/* 数据总览样式 */
.overview-section {
  max-width: 1400px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  color: #2c3e50;
  font-size: 1.8rem;
}

.map-controls {
  display: flex;
  gap: 10px;
}

.control-btn {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.control-btn:hover {
  background: #2980b9;
}

/* 图例 */
.legend {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.legend-title {
  font-weight: 600;
  color: #2c3e50;
  margin-right: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 30px;
  height: 20px;
  border: 1px solid #ddd;
  border-radius: 3px;
}

/* 地图容器 */
.map-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-info h3 {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

/* 系统设置样式 */
.settings-section h2 {
  color: #2c3e50;
  margin-bottom: 30px;
}

.settings-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 600px;
}

.setting-group {
  margin-bottom: 30px;
}

.setting-group h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #3498db;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.setting-item label {
  font-weight: 500;
  color: #555;
}

.setting-item input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  width: 150px;
}

.apply-btn {
  padding: 10px 30px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 20px;
}

.apply-btn:hover {
  background: #229954;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  min-width: 400px;
  max-width: 500px;
}

.modal-content h3 {
  margin-top: 0;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.modal-body p {
  margin: 12px 0;
  font-size: 1rem;
  line-height: 1.6;
}

.close-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  width: 100%;
  font-size: 1rem;
}

.close-btn:hover {
  background: #c0392b;
}
</style>