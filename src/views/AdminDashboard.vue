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
      <el-main class="content-area" v-loading="loading" element-loading-text="加载地图中...">
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
              <el-button 
                type="primary" 
                @click="loadMapData" 
                :icon="Refresh"
                :loading="loading"
              >
                刷新地图
              </el-button>
              <el-button @click="resetMap" :icon="RefreshLeft">
                清空地图
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
                :show-debug="showDebug"
                @block-click="handleBlockClick"
                @block-hover="handleBlockHover"
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

          <!-- 地图块总数统计 -->
          <el-row :gutter="20">
            <el-col :span="24">
              <el-card shadow="hover" class="total-blocks-card">
                <el-statistic title="地图块总数" :value="mapBlocks.length">
                  <template #prefix>
                    <el-icon color="#67B3DB" :size="24"><Grid /></el-icon>
                  </template>
                  <template #suffix>
                    <span style="font-size: 16px; color: #999;">个</span>
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
        <el-descriptions-item label="区域ID" v-if="selectedBlock.id">
          <el-tag>{{ formatBlockId(selectedBlock.id) }}</el-tag>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Monitor, DataAnalysis, Setting, Back, User, ArrowDown, SwitchButton,
  Location, View, Hide, Refresh, RefreshLeft, Grid, Promotion, WarningFilled, Warning, Check
} from '@element-plus/icons-vue'
import MapContainer from '../components/map/MapContainer.vue'
import mapApi from '../api/map'

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

// 加载状态
const loading = ref(false)

// 选中的块
const selectedBlock = ref(null)
const showBlockDialog = ref(false)

// 切换标签
const switchTab = (tab) => {
  currentTab.value = tab
}

// 返回首页
const goBack = () => {
  ElMessage.success('已退出登录')
  router.push('/')
}

/**
 * 从后端加载地图数据
 */
const loadMapData = async () => {
  loading.value = true
  
  try {
    // 调用后端 API 获取地图数据
    const data = await mapApi.getMapData()
    
    // 后端返回格式: [{'x':0,'y':0,'id':[0],'type':'building'}, ...]
    console.log('收到地图数据:', data)
    
    // 处理后端数据并转换为前端格式
    mapBlocks.value = processMapData(data)
    
    ElMessage.success(`成功加载 ${mapBlocks.value.length} 个地图块`)
  } catch (error) {
    console.error('加载地图数据失败:', error)
    ElMessage.error('加载地图数据失败，请检查网络连接')
    
    // 如果加载失败，使用模拟数据（开发测试用）
    loadMockMapData()
  } finally {
    loading.value = false
  }
}

/**
 * 处理后端返回的地图数据
 * @param {Array} data - 后端返回的原始数据
 * @returns {Array} - 处理后的地图块数组
 */
const processMapData = (data) => {
  if (!Array.isArray(data)) {
    console.warn('地图数据格式错误，应为数组')
    return []
  }
  
  return data.map(block => {
    // 处理 id 字段（后端可能返回数组或单个值）
    let blockId = block.id
    if (Array.isArray(block.id)) {
      blockId = block.id[0] // 取数组第一个元素
    }
    
    return {
      x: Number(block.x) || 0,
      y: Number(block.y) || 0,
      id: blockId,
      type: block.type || 'empty',
      data: block.data || {}
    }
  }).filter(block => {
    // 过滤掉坐标无效或超出范围的块
    return block.x >= 0 && block.x < mapWidth.value &&
           block.y >= 0 && block.y < mapHeight.value
  })
}

/**
 * 加载模拟地图数据（用于测试，后端没准备好时使用）
 */
const loadMockMapData = () => {
  console.log('使用模拟数据')
  
  const mockData = [
    // 建筑物
    { x: 0, y: 0, id: [1], type: 'building', data: { name: '建筑A' } },
    { x: 1, y: 0, id: [2], type: 'building', data: { name: '建筑B' } },
    { x: 19, y: 0, id: [3], type: 'building', data: { name: '建筑C' } },
    { x: 19, y: 14, id: [4], type: 'building', data: { name: '建筑D' } },
    
    // 道路 - 横向主干道
    { x: 5, y: 7, id: [101], type: 'smooth', data: { name: '主干道', speed: 80 } },
    { x: 6, y: 7, id: [102], type: 'smooth', data: { name: '主干道', speed: 80 } },
    { x: 7, y: 7, id: [103], type: 'normal', data: { name: '主干道', speed: 60 } },
    { x: 8, y: 7, id: [104], type: 'normal', data: { name: '主干道', speed: 60 } },
    { x: 9, y: 7, id: [105], type: 'congested', data: { name: '主干道', speed: 20 } },
    { x: 10, y: 7, id: [106], type: 'congested', data: { name: '主干道', speed: 20 } },
    { x: 11, y: 7, id: [107], type: 'accident', data: { name: '主干道', speed: 0 } },
    { x: 12, y: 7, id: [108], type: 'normal', data: { name: '主干道', speed: 60 } },
    
    // 道路 - 纵向支路
    { x: 9, y: 5, id: [201], type: 'normal', data: { name: '支路', speed: 40 } },
    { x: 9, y: 6, id: [202], type: 'normal', data: { name: '支路', speed: 40 } },
    { x: 9, y: 8, id: [203], type: 'construction', data: { name: '支路', speed: 10 } },
    { x: 9, y: 9, id: [204], type: 'construction', data: { name: '支路', speed: 10 } },
  ]
  
  mapBlocks.value = processMapData(mockData)
  ElMessage.info('已加载模拟数据')
}

/**
 * 初始化地图 - 空白地图
 */
const initMap = () => {
  mapBlocks.value = []
}

/**
 * 重置/清空地图
 */
const resetMap = () => {
  initMap()
  ElMessage.success('地图已清空')
}

/**
 * 应用地图设置
 */
const applySettings = () => {
  // 重新加载地图数据（根据新的尺寸）
  loadMapData()
  ElMessage.success('设置已应用')
}

/**
 * 恢复默认设置
 */
const resetSettings = () => {
  mapWidth.value = 20
  mapHeight.value = 15
  blockSize.value = 50
  ElMessage.success('已恢复默认设置')
}

/**
 * 处理地图块点击事件
 */
const handleBlockClick = (blockInfo) => {
  selectedBlock.value = blockInfo
  showBlockDialog.value = true
}

/**
 * 处理地图块悬停事件
 */
const handleBlockHover = (blockInfo) => {
  // console.log('悬停:', blockInfo)
}

/**
 * 格式化块 ID 显示
 */
const formatBlockId = (id) => {
  if (Array.isArray(id)) {
    return id.join(', ')
  }
  return id
}

/**
 * 获取块类型名称
 */
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

/**
 * 获取块标签类型
 */
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

/**
 * 计算交通统计
 */
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

/**
 * 页面加载时初始化
 */
onMounted(() => {
  ElMessage.success('欢迎使用管理者控制台')
  // 自动加载地图数据
  loadMapData()
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

.total-blocks-card {
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