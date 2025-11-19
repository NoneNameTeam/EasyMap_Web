<template>
  <div class="admin-dashboard">
    <!-- 侧边栏 -->
    <el-aside width="260px" class="sidebar">
      <div class="logo">
        <el-icon :size="32" color="#fff"><Monitor /></el-icon>
        <h2>管理控制台</h2>
      </div>

      <el-menu
        :default-active="currentTab"
        class="sidebar-menu"
        background-color="transparent"
        text-color="#fff"
        active-text-color="#FFFBDD"
        @select="switchTab"
      >
        <el-menu-item index="overview">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据总览</span>
        </el-menu-item>
        <el-menu-item index="settings">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <el-button type="info" plain @click="goBack" class="back-btn">
          <el-icon><Back /></el-icon>
          返回首页
        </el-button>
      </div>
    </el-aside>

    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 顶部栏 -->
      <el-header height="70px" class="top-bar">
        <h1>管理者仪表盘</h1>
        <el-dropdown>
          <div class="user-info">
            <el-avatar :size="35" style="background: #67B3DB; margin-right: 10px;">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span>管理员</span>
            <el-icon class="ml-1"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>
                <el-icon><User /></el-icon>
                个人信息
              </el-dropdown-item>
              <el-dropdown-item divided @click="goBack">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <!-- 内容区域 -->
      <el-main class="content-area">
        <!-- 数据总览 -->
        <div v-if="currentTab === 'overview'" class="overview-section">
          <!-- 标题和控制按钮 -->
          <div class="section-header">
            <h2>
              <el-icon><Location /></el-icon>
              交通实时监控
            </h2>
            <el-space wrap>
              <el-button 
                :type="showDebug ? 'success' : 'info'" 
                @click="showDebug = !showDebug"
                :icon="showDebug ? View : Hide"
              >
                {{ showDebug ? '隐藏' : '显示' }}坐标
              </el-button>
              <el-button type="primary" @click="simulateVehicleMovement" :icon="Refresh">
                移动车辆
              </el-button>
              <el-button type="success" @click="startRealtimeUpdate" :icon="VideoPlay">
                开始更新
              </el-button>
              <el-button type="danger" @click="stopRealtimeUpdate" :icon="VideoPause">
                停止更新
              </el-button>
              <el-button @click="resetMap" :icon="RefreshLeft">
                重置地图
              </el-button>
            </el-space>
          </div>

          <!-- 图例 -->
          <el-card shadow="never" class="legend-card">
            <template #header>
              <span><el-icon><Grid /></el-icon> 图例说明</span>
            </template>
            <div class="legend">
              <el-tag type="success" effect="plain">
                <span class="legend-dot" style="background: #27ae60;"></span>
                畅通
              </el-tag>
              <el-tag type="info" effect="plain">
                <span class="legend-dot" style="background: #95a5a6;"></span>
                正常
              </el-tag>
              <el-tag type="danger" effect="plain">
                <span class="legend-dot" style="background: #e74c3c;"></span>
                拥堵
              </el-tag>
              <el-tag type="warning" effect="plain">
                <span class="legend-dot" style="background: #e67e22;"></span>
                事故
              </el-tag>
              <el-tag color="#f39c12" effect="plain">
                <span class="legend-dot" style="background: #f39c12;"></span>
                施工
              </el-tag>
              <el-tag color="#34495e" effect="plain">
                <span class="legend-dot" style="background: #34495e;"></span>
                建筑
              </el-tag>
            </div>
          </el-card>

          <!-- 地图容器 -->
          <el-card shadow="hover" class="map-card">
            <div class="map-wrapper">
              <MapContainer
                :width="mapWidth"
                :height="mapHeight"
                :block-size="blockSize"
                :blocks="mapBlocks"
                :vehicles="vehicles"
                :show-debug="showDebug"
                @block-click="handleBlockClick"
                @block-hover="handleBlockHover"
                @vehicle-click="handleVehicleClick"
                @vehicle-position-update="handleVehiclePositionUpdate"
              />
            </div>
          </el-card>

          <!-- 统计卡片 -->
          <el-row :gutter="20" class="stats-row">
            <el-col :xs="24" :sm="12" :md="6">
              <el-card shadow="hover" class="stat-card smooth-card">
                <el-statistic title="畅通路段" :value="trafficStats.smooth">
                  <template #prefix>
                    <el-icon color="#27ae60"><Promotion /></el-icon>
                  </template>
                </el-statistic>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <el-card shadow="hover" class="stat-card normal-card">
                <el-statistic title="正常路段" :value="trafficStats.normal">
                  <template #prefix>
                    <el-icon color="#3498db"><Location /></el-icon>
                  </template>
                </el-statistic>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <el-card shadow="hover" class="stat-card congested-card">
                <el-statistic title="拥堵路段" :value="trafficStats.congested">
                  <template #prefix>
                    <el-icon color="#e74c3c"><WarningFilled /></el-icon>
                  </template>
                </el-statistic>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <el-card shadow="hover" class="stat-card alert-card">
                <el-statistic 
                  title="事故/施工" 
                  :value="trafficStats.accident + trafficStats.construction"
                >
                  <template #prefix>
                    <el-icon color="#e67e22"><Warning /></el-icon>
                  </template>
                </el-statistic>
              </el-card>
            </el-col>
          </el-row>

          <!-- 在线车辆统计 -->
          <el-row :gutter="20">
            <el-col :span="24">
              <el-card shadow="hover" class="vehicle-stat-card">
                <el-statistic title="在线车辆" :value="vehicles.length">
                  <template #prefix>
                    <el-icon color="#67B3DB" :size="24"><Van /></el-icon>
                  </template>
                  <template #suffix>
                    <span style="font-size: 16px; color: #999;">辆</span>
                  </template>
                </el-statistic>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 系统设置 -->
        <div v-if="currentTab === 'settings'" class="settings-section">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span><el-icon><Setting /></el-icon> 地图配置</span>
              </div>
            </template>

            <el-form label-width="150px" label-position="left">
              <el-form-item label="地图宽度（块）">
                <el-input-number 
                  v-model="mapWidth" 
                  :min="10" 
                  :max="30" 
                  controls-position="right"
                />
              </el-form-item>
              
              <el-form-item label="地图高度（块）">
                <el-input-number 
                  v-model="mapHeight" 
                  :min="10" 
                  :max="30" 
                  controls-position="right"
                />
              </el-form-item>
              
              <el-form-item label="块大小（像素）">
                <el-input-number 
                  v-model="blockSize" 
                  :min="30" 
                  :max="100" 
                  :step="10"
                  controls-position="right"
                />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="applySettings" :icon="Check">
                  应用设置
                </el-button>
                <el-button @click="resetSettings" :icon="RefreshLeft">
                  恢复默认
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </el-main>
    </el-container>

    <!-- 区域信息弹窗 -->
    <el-dialog 
      v-model="showBlockDialog" 
      title="区域详细信息" 
      width="500px"
      :close-on-click-modal="true"
    >
      <el-descriptions :column="1" border v-if="selectedBlock">
        <el-descriptions-item label="区域类型">
          <el-tag :type="getBlockTagType(selectedBlock.type)">
            {{ getBlockTypeName(selectedBlock.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="坐标位置">
          ({{ selectedBlock.x }}, {{ selectedBlock.y }})
        </el-descriptions-item>
        <el-descriptions-item label="区域名称" v-if="selectedBlock.data?.name">
          {{ selectedBlock.data.name }}
        </el-descriptions-item>
        <el-descriptions-item label="通行速度" v-if="selectedBlock.data?.speed !== undefined">
          <el-tag type="info">{{ selectedBlock.data.speed }} km/h</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态" v-if="selectedBlock.type === 'congested'">
          <el-tag type="danger" effect="dark">拥堵中</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态" v-if="selectedBlock.type === 'accident'">
          <el-tag type="warning" effect="dark">发生事故</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态" v-if="selectedBlock.type === 'construction'">
          <el-tag color="#f39c12" effect="dark">施工中</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <el-button type="primary" @click="showBlockDialog = false">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 车辆信息弹窗 -->
    <el-dialog 
      v-model="showVehicleDialog" 
      title="车辆详细信息" 
      width="500px"
    >
      <el-descriptions :column="2" border v-if="selectedVehicle">
        <el-descriptions-item label="车牌号" :span="2">
          <el-tag type="primary" size="large">{{ selectedVehicle.plateNumber }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="车辆类型">
          {{ getVehicleTypeName(selectedVehicle.type) }}
        </el-descriptions-item>
        <el-descriptions-item label="当前速度">
          <el-tag :type="getSpeedTagType(selectedVehicle.speed)">
            {{ selectedVehicle.speed }} km/h
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="位置坐标" :span="2">
          ({{ selectedVehicle.x }}, {{ selectedVehicle.y }})
        </el-descriptions-item>
        <el-descriptions-item label="行驶方向" :span="2">
          {{ getDirectionName(selectedVehicle.direction) }}
        </el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <el-button @click="showVehicleDialog = false">取消</el-button>
        <el-button type="primary" @click="showVehicleDialog = false">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Monitor, DataAnalysis, Setting, Back, User, ArrowDown, SwitchButton,
  Location, View, Hide, Refresh, VideoPlay, VideoPause, RefreshLeft,
  Grid, Promotion, WarningFilled, Warning, Van, Check
} from '@element-plus/icons-vue'
import MapContainer from '../components/map/MapContainer.vue'
// import vehicleApi from '../api/vehicle'

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

// 车辆数据
const vehicles = ref([])

// 选中的块和车辆
const selectedBlock = ref(null)
const selectedVehicle = ref(null)
const showBlockDialog = ref(false)
const showVehicleDialog = ref(false)

// 定时器
let updateTimer = null

// 切换标签
const switchTab = (tab) => {
  currentTab.value = tab
}

// 返回首页
const goBack = () => {
  ElMessage.success('已退出登录')
  router.push('/')
}

// 初始化地图 - 空白地图
const initMap = () => {
  mapBlocks.value = []
}

// 模拟车辆移动
const simulateVehicleMovement = () => {
  if (vehicles.value.length === 0) {
    vehicles.value = [
      {
        id: 1,
        plateNumber: '粤A12345',
        x: 5,
        y: 7,
        offsetX: 0,
        offsetY: 0,
        speed: 60,
        direction: 0,
        type: 'car',
        showTrail: true,
        transitionDuration: 1000
      },
      {
        id: 2,
        plateNumber: '粤B67890',
        x: 10,
        y: 8,
        offsetX: 0,
        offsetY: 0,
        speed: 45,
        direction: 90,
        type: 'truck',
        showTrail: true,
        transitionDuration: 1000
      },
      {
        id: 3,
        plateNumber: '粤C11111',
        x: 8,
        y: 5,
        offsetX: 0,
        offsetY: 0,
        speed: 50,
        direction: 180,
        type: 'bus',
        showTrail: true,
        transitionDuration: 1000
      }
    ]
    ElMessage.success('已添加测试车辆')
  } else {
    vehicles.value = vehicles.value.map(vehicle => {
      const directions = [
        { dx: 1, dy: 0, angle: 90 },
        { dx: -1, dy: 0, angle: 270 },
        { dx: 0, dy: 1, angle: 180 },
        { dx: 0, dy: -1, angle: 0 }
      ]
      
      const move = directions[Math.floor(Math.random() * directions.length)]
      
      let newX = vehicle.x + move.dx
      let newY = vehicle.y + move.dy
      
      newX = Math.max(0, Math.min(mapWidth.value - 1, newX))
      newY = Math.max(0, Math.min(mapHeight.value - 1, newY))
      
      return {
        ...vehicle,
        x: newX,
        y: newY,
        direction: move.angle,
        speed: Math.floor(Math.random() * 40) + 40
      }
    })
    ElMessage.info('车辆已移动')
  }
}

// 开始实时更新
const startRealtimeUpdate = () => {
  if (updateTimer) {
    ElMessage.warning('已在自动更新中')
    return
  }
  
  updateTimer = setInterval(() => {
    simulateVehicleMovement()
  }, 2000)
  
  ElMessage.success('开始自动更新')
}

// 停止实时更新
const stopRealtimeUpdate = () => {
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
    ElMessage.info('已停止自动更新')
  } else {
    ElMessage.warning('当前未在自动更新')
  }
}

// 重置地图
const resetMap = () => {
  initMap()
  vehicles.value = []
  stopRealtimeUpdate()
  ElMessage.success('地图已重置')
}

// 应用设置
const applySettings = () => {
  initMap()
  ElMessage.success('设置已应用')
}

// 恢复默认设置
const resetSettings = () => {
  mapWidth.value = 20
  mapHeight.value = 15
  blockSize.value = 50
  ElMessage.success('已恢复默认设置')
}

// 块点击处理
const handleBlockClick = (blockInfo) => {
  selectedBlock.value = blockInfo
  showBlockDialog.value = true
}

// 块悬停处理
const handleBlockHover = (blockInfo) => {
  // console.log('悬停:', blockInfo)
}

// 车辆点击处理
const handleVehicleClick = (vehicleInfo) => {
  selectedVehicle.value = vehicleInfo
  showVehicleDialog.value = true
}

// 车辆位置更新处理
const handleVehiclePositionUpdate = (positionInfo) => {
  console.log('车辆位置更新:', positionInfo)
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

// 获取块标签类型
const getBlockTagType = (type) => {
  const types = {
    smooth: 'success',
    normal: 'info',
    congested: 'danger',
    accident: 'warning',
    construction: 'warning',
    building: ''
  }
  return types[type] || 'info'
}

// 获取车辆类型名称
const getVehicleTypeName = (type) => {
  const names = {
    car: '小汽车',
    truck: '货车',
    bus: '公交车'
  }
  return names[type] || type
}

// 获取速度标签类型
const getSpeedTagType = (speed) => {
  if (speed >= 60) return 'success'
  if (speed >= 40) return 'warning'
  return 'danger'
}

// 获取方向名称
const getDirectionName = (direction) => {
  if (direction >= 337.5 || direction < 22.5) return '北 ↑'
  if (direction >= 22.5 && direction < 67.5) return '东北 ↗'
  if (direction >= 67.5 && direction < 112.5) return '东 →'
  if (direction >= 112.5 && direction < 157.5) return '东南 ↘'
  if (direction >= 157.5 && direction < 202.5) return '南 ↓'
  if (direction >= 202.5 && direction < 247.5) return '西南 ↙'
  if (direction >= 247.5 && direction < 292.5) return '西 ←'
  if (direction >= 292.5 && direction < 337.5) return '西北 ↖'
  return '未知'
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
  ElMessage.success('欢迎使用管理者控制台')
})

// 页面卸载时清理
onUnmounted(() => {
  stopRealtimeUpdate()
})
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: #f0f2f5;
}

/* 侧边栏 */
.sidebar {
  background: linear-gradient(180deg, #67B3DB 0%, #9EDAF1 100%);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 30px 20px;
  text-align: center;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.logo h2 {
  margin-top: 10px;
  font-size: 1.3rem;
}

.sidebar-menu {
  flex: 1;
  border: none;
  padding: 20px 0;
}

.sidebar-menu .el-menu-item {
  margin: 5px 15px;
  border-radius: 8px;
  transition: all 0.3s;
}

.sidebar-menu .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.sidebar-menu .el-menu-item.is-active {
  background: rgba(255, 255, 255, 0.2) !important;
  font-weight: 600;
}

.sidebar-footer {
  padding: 20px;
}

.back-btn {
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  color: #67B3DB;
}

.back-btn:hover {
  background: white;
}

/* 主容器 */
.main-container {
  flex: 1;
}

/* 顶部栏 */
.top-bar {
  background: linear-gradient(135deg, #67B3DB 0%, #9EDAF1 33%, #CDEEF8 66%, #FFFBDD 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
}

.top-bar h1 {
  color: #2c3e50;
  font-size: 1.5rem;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 15px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s;
}

.user-info:hover {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ml-1 {
  margin-left: 5px;
}

/* 内容区域 */
.content-area {
  background: #f0f2f5;
  padding: 20px;
}

/* 数据总览 */
.overview-section {
  max-width: 1600px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.section-header h2 {
  color: #2c3e50;
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

/* 图例卡片 */
.legend-card {
  margin-bottom: 20px;
}

.legend {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 5px;
}

/* 地图卡片 */
.map-card {
  margin-bottom: 20px;
  border: 2px solid #CDEEF8;
}

.map-wrapper {
  display: flex;
  justify-content: center;
  padding: 10px;
}

/* 统计行 */
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  transition: all 0.3s;
  border-left: 4px solid #67B3DB;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(103, 179, 219, 0.2);
}

.smooth-card {
  border-left-color: #27ae60;
}

.normal-card {
  border-left-color: #3498db;
}

.congested-card {
  border-left-color: #e74c3c;
}

.alert-card {
  border-left-color: #e67e22;
}

.vehicle-stat-card {
  border-left: 4px solid #67B3DB;
}

/* 系统设置 */
.settings-section {
  max-width: 800px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2c3e50;
}

/* 响应式 */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .top-bar h1 {
    font-size: 1.2rem;
  }
}
</style>