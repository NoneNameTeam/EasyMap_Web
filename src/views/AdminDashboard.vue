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
      <el-main 
        class="content-area" 
        v-loading="loading" 
        :element-loading-text="`加载地图中... ${loadingProgress.current} / ~${loadingProgress.total} (${loadingProgress.percentage.toFixed(1)}%)`"
      >
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
              
              <!-- ✅ 添加车辆控制按钮 -->
              <el-button 
                type="warning" 
                @click="simulateVehicleMovement" 
                :icon="Van"
              >
                移动车辆
              </el-button>
              <el-button 
                type="success" 
                @click="startRealtimeUpdate" 
                :icon="VideoPlay"
              >
                开始自动更新
              </el-button>
              <el-button 
                type="danger" 
                @click="stopRealtimeUpdate" 
                :icon="VideoPause"
              >
                停止更新
              </el-button>
              
              <el-button 
                type="primary" 
                @click="loadMapData" 
                :icon="Refresh"
                :loading="loading"
              >
                刷新地图
              </el-button>

              <!-- ✅ 新增：诊断按钮 -->
              <el-button 
                  type="warning" 
                  @click="diagnosisAPI"
                  :icon="Cpu"
                >
                  API诊断
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
              <!-- ✅ 新增 -->
              <el-tag type="danger" effect="plain">
                <span class="legend-dot" style="background: #c0392b;"></span>
                道路封闭
              </el-tag>
              <el-tag color="#34495e" effect="plain">
                <span class="legend-dot" style="background: #34495e;"></span>
                建筑
              </el-tag>
              <!-- ✅ 新增 -->
              <el-tag type="info" effect="plain">
                <span class="legend-dot" style="background: #3498db;"></span>
                水域
              </el-tag>
            </div>
          </el-card>

          <!-- 地图容器 -->
          <el-card shadow="hover" class="map-card">
            <div class="map-wrapper">
              <CanvasMapContainer
                :width="mapWidth"
                :height="mapHeight"
                :block-size="blockSize"
                :blocks="mapBlocks"
                :vehicles="vehicles"
                :show-debug="showDebug"
                :background-image="backgroundImage"
                @block-click="handleBlockClick"
                @block-hover="handleBlockHover"
                @vehicle-click="handleVehicleClick"
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
                  title="异常路段" 
                  :value="trafficStats.accident + trafficStats.construction + trafficStats.road_closure"
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
                  :max="160" 
                  controls-position="right"
                />
              </el-form-item>
              
              <el-form-item label="地图高度（块）">
                <el-input-number 
                  v-model="mapHeight" 
                  :min="10" 
                  :max="160" 
                  controls-position="right"
                />
              </el-form-item>
              
              <el-form-item label="块大小（像素）">
                <el-input-number 
                  v-model="blockSize" 
                  :min="1" 
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
        <el-descriptions-item label="区域ID">
          <el-tag>{{ selectedBlock.id }}</el-tag>
        </el-descriptions-item>
        
        <!-- ✅ 新增：显示原始 block 类型 -->
        <el-descriptions-item label="区块类别" v-if="selectedBlock.data?.block">
          <el-tag>{{ selectedBlock.data.block }}</el-tag>
        </el-descriptions-item>
        
        <el-descriptions-item label="坐标位置">
          ({{ selectedBlock.x }}, {{ selectedBlock.y }})
        </el-descriptions-item>
        
        <el-descriptions-item label="道路ID" v-if="selectedBlock.data?.roadId">
          <el-tag type="info">{{ selectedBlock.data.roadId }}</el-tag>
        </el-descriptions-item>
        
        <el-descriptions-item label="交通状况" v-if="selectedBlock.data?.traffic">
          <el-tag :type="getTrafficTagType(selectedBlock.data.traffic)">
            {{ getTrafficName(selectedBlock.data.traffic) }}
          </el-tag>
        </el-descriptions-item>
        
        <!-- 事件信息 -->
        <el-descriptions-item label="事件" v-if="selectedBlock.data?.event && selectedBlock.data.event !== 'NONE'">
          <el-tag type="warning" effect="dark">
            {{ getEventName(selectedBlock.data.event) }}
          </el-tag>
        </el-descriptions-item>
        
        <!-- <el-descriptions-item label="通行速度" v-if="selectedBlock.data?.speed !== undefined">
          <el-tag :type="getSpeedTagType(selectedBlock.data.speed)">
            {{ selectedBlock.data.speed }} km/h
          </el-tag>
        </el-descriptions-item> -->
        
        <el-descriptions-item label="更新时间" v-if="selectedBlock.data?.updatedAt">
          {{ formatTime(selectedBlock.data.updatedAt) }}
        </el-descriptions-item>
        
        <el-descriptions-item label="区域名称" v-if="selectedBlock.data?.name">
          {{ selectedBlock.data.name }}
        </el-descriptions-item>
      </el-descriptions>
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
  Location, View, Hide, Refresh, RefreshLeft, Grid, Promotion, WarningFilled, Warning, Check, Van
} from '@element-plus/icons-vue'
import MapContainer from '../components/map/MapContainer.vue'
import CanvasMapContainer from '../components/map/CanvasMapContainer.vue'
import mapApi from '../api/map'
// import vehicleApi from '../api/vehicle'
import mapBg from '@/assets/bgi.png'

const router = useRouter()

// 当前选中的标签
const currentTab = ref('overview')

// 地图配置
const mapWidth = ref(160)
const mapHeight = ref(160)
const blockSize = ref(4)
const showDebug = ref(false)
const backgroundImage = ref(mapBg)

// 地图块数据
const mapBlocks = ref([])

// 加载状态
const loading = ref(false)

// ✅ 新增：加载进度
const loadingProgress = ref({
  current: 0,
  total: 25600,  // 预估总数
  percentage: 0,
  pageCount: 0
})

// 选中的块
const selectedBlock = ref(null)
const showBlockDialog = ref(false)

// 车辆数据
const vehicles = ref([])

// 定时器
let updateTimer = null

// 选中的车辆
const selectedVehicle = ref(null)
const showVehicleDialog = ref(false)

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
  
  // ✅ 重置进度
  loadingProgress.value = {
    current: 0,
    total: 25000,
    percentage: 0,
    pageCount: 0
  }
  
  try {
    console.log('📍 开始加载地图数据...')
    
    // ✅ 使用进度回调
    const data = await mapApi.getAllMapData({}, (count, hasMore, pageCount) => {
      loadingProgress.value = {
        current: count,
        total: 25000,  // 预估值
        percentage: Math.min((count / 25000) * 100, 99),  // 最多显示 99%
        pageCount: pageCount
      }
      console.log(`📊 加载进度: ${count} / ~25000 (第 ${pageCount} 页)`)
    })
    
    console.log('✅ 收到地图数据:', data.length, '条')
    console.log('📦 原始数据示例:', data.slice(0, 3))
    
    // ✅ 检查数据是否为空
    if (!data || data.length === 0) {
      ElMessage.warning('后端返回的地图数据为空')
      loadingProgress.value.percentage = 100
      return
    }
    
    // 处理后端数据并转换为前端格式
    mapBlocks.value = processMapData(data)
    
    console.log('🗺️ 处理后的地图块数量:', mapBlocks.value.length)
    console.log('🔍 处理后数据示例:', mapBlocks.value.slice(0, 3))
    
    // ✅ 更新进度为 100%
    loadingProgress.value = {
      current: mapBlocks.value.length,
      total: mapBlocks.value.length,
      percentage: 100,
      pageCount: loadingProgress.value.pageCount
    }
    
    ElMessage.success(`成功加载 ${mapBlocks.value.length} 个地图块`)
  } catch (error) {
    console.error('❌ 加载地图数据失败:', error)
    ElMessage.error(`加载失败: ${error.message}`)
    
    // ✅ 开发测试：加载失败时使用模拟数据
    // loadMockMapData()
  } finally {
    loading.value = false
  }
}

import { Cpu } from '@element-plus/icons-vue'  // ✅ 添加图标导入

/**
 * API 诊断函数 - 支持代理
 */
const diagnosisAPI = async () => {
  console.log('🔧 开始 API 诊断...')
  console.log('📡 API Base URL:', import.meta.env.VITE_API_BASE_URL)
  
  ElMessage.info('正在进行 API 诊断...')
  
  try {
    // 1. 测试健康检查
    console.log('1️⃣ 测试健康检查 /health')
    const health = await mapApi.checkHealth()
    console.log('✅ 健康检查成功:', health)
    
    // 2. 测试获取第一页数据
    console.log('2️⃣ 测试获取第一页数据 /maps/data?limit=10')
    const firstPage = await mapApi.getMapData({ limit: 10 })
    console.log('✅ 第一页数据:', firstPage)
    
    // ✅ 修改：firstPage 已经是解包后的数据
    console.log('  - items数量:', firstPage.items?.length || 0)
    console.log('  - nextCursor:', firstPage.nextCursor)
    console.log('  - hasNextPage:', firstPage.hasNextPage)
    
    if (firstPage.items && firstPage.items.length > 0) {
      console.log('  - 第一条数据示例:', firstPage.items[0])
    } else {
      console.warn('⚠️ 第一页没有返回数据！')
      console.log('  - 原始响应:', firstPage)
    }
    
    // 3. 测试按坐标查询
    if (firstPage.items && firstPage.items.length > 0) {
      const testItem = firstPage.items[0]
      console.log(`3️⃣ 测试按坐标查询 /maps/${testItem.x}/${testItem.y}`)
      const coordData = await mapApi.getMapByCoord(testItem.x, testItem.y)
      console.log('✅ 坐标查询结果:', coordData)
    }
    
    // 4. 测试环境变量
    console.log('4️⃣ 环境配置检查')
    console.log('  - VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
    console.log('  - MODE:', import.meta.env.MODE)
    console.log('  - DEV:', import.meta.env.DEV)
    console.log('  - PROD:', import.meta.env.PROD)
    
    // 5. 显示诊断结果
    const message = `
      ✅ API 诊断完成！
      
      环境: ${import.meta.env.MODE}
      API地址: ${import.meta.env.VITE_API_BASE_URL}
      健康状态: ${health.status}
      第一页数据: ${firstPage.items?.length || 0} 条
      是否有下一页: ${firstPage.hasNextPage ? '是' : '否'}
      
      详细信息请查看控制台
    `
    
    ElMessage.success({
      message: message,
      duration: 5000,
      showClose: true
    })
    
  } catch (error) {
    console.error('❌ API 诊断失败:', error)
    console.error('  - 错误类型:', error.name)
    console.error('  - 错误信息:', error.message)
    console.error('  - 错误堆栈:', error.stack)
    
    ElMessage.error({
      message: `诊断失败: ${error.message}`,
      duration: 5000,
      showClose: true
    })
  }
}

/**
 * 处理后端返回的地图数据
 */
const processMapData = (data) => {
  console.log('🔄 开始处理地图数据...')
  console.log('📥 原始数据数量:', data?.length || 0)
  
  if (!Array.isArray(data)) {
    console.error('❌ 地图数据格式错误，应为数组，实际类型:', typeof data)
    return []
  }
  
  if (data.length === 0) {
    console.warn('⚠️ 原始数据为空数组')
    return []
  }
  
  console.log('📋 原始数据示例（前3条）:', data.slice(0, 3))
  
  const processed = data.map((block, index) => {
    // 每处理 5000 条打印一次进度
    if (index % 5000 === 0) {
      console.log(`⏳ 处理进度: ${index} / ${data.length}`)
    }
    
    // 确定块类型
    let type = 'empty'
    
    if (block.block === 'BUILDING') {
      type = 'building'
    } 
    else if (block.block === 'WATER') {
      type = 'water'
    }
    else if (block.event && block.event !== 'NONE') {
      const eventMap = {
        'ACCIDENT': 'accident',
        'CONSTRUCTION': 'construction',
        'ROAD_CLOSURE': 'road_closure'
      }
      type = eventMap[block.event] || 'normal'
    }
    else if (block.traffic && block.traffic !== 'UNKNOWN') {
      const trafficMap = {
        'SMOOTH': 'smooth',
        'NORMAL': 'normal',
        'CONGESTED': 'congested'
      }
      type = trafficMap[block.traffic] || 'normal'
    }
    
    let speed = 60
    if (block.traffic === 'SMOOTH') speed = 80
    else if (block.traffic === 'NORMAL') speed = 60
    else if (block.traffic === 'CONGESTED') speed = 20
    else if (block.traffic === 'UNKNOWN') speed = 40
    else if (block.event === 'ACCIDENT') speed = 0
    else if (block.event === 'CONSTRUCTION') speed = 10
    else if (block.event === 'ROAD_CLOSURE') speed = 0
    
    return {
      x: Number(block.x) || 0,
      y: Number(block.y) || 0,
      id: block.id,
      type: type,
      data: {
        roadId: block.roadId,
        traffic: block.traffic,
        event: block.event,
        block: block.block,
        speed: speed,
        updatedAt: block.updatedAt,
        name: getBlockName(type, block)
      }
    }
  })
  
  console.log('✅ 数据处理完成，处理后数量:', processed.length)
  
  // 过滤坐标范围
  const filtered = processed.filter(block => {
    return block.x >= 0 && block.x < mapWidth.value &&
           block.y >= 0 && block.y < mapHeight.value
  })
  
  const filteredCount = processed.length - filtered.length
  if (filteredCount > 0) {
    console.log(`🚫 过滤掉 ${filteredCount} 个超出范围的块`)
  }
  
  console.log('📊 最终返回数量:', filtered.length)
  console.log('📋 处理后数据示例（前3条）:', filtered.slice(0, 3))
  
  return filtered
}

/**
 * 获取地图块名称
 */
const getBlockName = (type, block) => {
  if (type === 'building') return '建筑物'
  if (type === 'water') return '水域'  // ✅ 新增
  if (type === 'road_closure') return '道路封闭'  // ✅ 新增
  if (block.roadId) return `道路 ${block.roadId}`
  return '区域'
}

// /**
//  * 获取地图块名称
//  */
// const getBlockName = (type, block) => {
//   if (type === 'building') return '建筑物'
//   if (block.roadId) return `道路 ${block.roadId}`
//   return '区域'
// }

/**
 * 获取交通状况标签类型
 */
const getTrafficTagType = (traffic) => {
  const typeMap = {
    'SMOOTH': 'success',
    'NORMAL': 'info',
    'CONGESTED': 'danger',
    'UNKNOWN': 'warning'  // ✅ 新增
  }
  return typeMap[traffic] || 'info'
}

/**
 * 获取交通状况名称
 */
const getTrafficName = (traffic) => {
  const nameMap = {
    'SMOOTH': '畅通',
    'NORMAL': '正常',
    'CONGESTED': '拥堵',
    'UNKNOWN': '未知'  // ✅ 新增
  }
  return nameMap[traffic] || traffic
}

/**
 * 获取事件名称
 */
const getEventName = (event) => {
  const nameMap = {
    'NONE': '无事件',  // ✅ 新增
    'ACCIDENT': '交通事故',
    'CONSTRUCTION': '道路施工',
    'ROAD_CLOSURE': '道路封闭'
  }
  return nameMap[event] || event
}

/**
 * 从后端获取车辆实时位置
 */
const fetchVehiclesPosition = async () => {
  try {
    const data = await vehicleApi.getVehiclesRealtime()
    
    // 处理后端返回的车辆数据
    if (data && Array.isArray(data.vehicles)) {
      vehicles.value = data.vehicles.map(v => ({
        id: v.id,
        plateNumber: v.plateNumber,
        x: Math.floor(v.x),
        y: Math.floor(v.y),
        offsetX: ((v.x % 1) * blockSize.value) || 0,
        offsetY: ((v.y % 1) * blockSize.value) || 0,
        speed: v.speed || 0,
        direction: v.direction || 0,
        type: v.type || 'car',
        status: v.status || 'moving',
        showTrail: true,
        transitionDuration: 1000
      }))
      
      console.log(`✅ 已更新 ${vehicles.value.length} 辆车的位置`)
    } else {
      console.warn('车辆数据格式错误')
    }
  } catch (error) {
    console.error('获取车辆位置失败:', error)
    // 不显示错误提示，避免频繁弹窗
  }
}

/**
 * 模拟车辆移动（测试用）
 */
const simulateVehicleMovement = () => {
  if (vehicles.value.length === 0) {
    // 添加测试车辆
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
        status: 'moving',
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
        status: 'moving',
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
        status: 'moving',
        showTrail: true,
        transitionDuration: 1000
      }
    ]
    ElMessage.success('已添加测试车辆')
  } else {
    // 随机移动车辆
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

/**
 * 开始实时更新（定时轮询）
 */
const startRealtimeUpdate = () => {
  if (updateTimer) {
    ElMessage.warning('已在自动更新中')
    return
  }
  
  // ✅ 立即执行一次
  fetchVehiclesPosition()
  // 或者使用模拟数据测试：
  // simulateVehicleMovement()
  
  // ✅ 设置定时器，每 3 秒轮询一次
  updateTimer = setInterval(() => {
    // 生产环境：调用真实 API
    fetchVehiclesPosition()
    
    // 测试环境：使用模拟数据
    // simulateVehicleMovement()
  }, 3000)  // ✅ 3000ms = 3秒轮询一次
  
  ElMessage.success('开始自动更新车辆位置（每3秒）')
}

/**
 * 停止实时更新
 */
const stopRealtimeUpdate = () => {
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
    ElMessage.info('已停止自动更新')
  } else {
    ElMessage.warning('当前未在自动更新')
  }
}

/**
 * 处理车辆点击
 */
const handleVehicleClick = (vehicleInfo) => {
  selectedVehicle.value = vehicleInfo
  showVehicleDialog.value = true
}

/**
 * 处理车辆位置更新
 */
const handleVehiclePositionUpdate = (positionInfo) => {
  console.log('车辆位置更新:', positionInfo)
}

/**
 * 获取车辆类型名称
 */
const getVehicleTypeName = (type) => {
  const names = {
    car: '小汽车',
    truck: '货车',
    bus: '公交车'
  }
  return names[type] || type
}

/**
 * 获取方向名称
 */
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

/**
 * 获取车辆速度标签类型
 */
const getVehicleSpeedTagType = (speed) => {
  if (speed >= 60) return 'success'
  if (speed >= 30) return 'warning'
  return 'danger'
}

/**
 * 格式化时间
 */
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 加载模拟地图数据（用于测试）
 */
const loadMockMapData = () => {
  console.log('使用模拟数据')
  
  const mockData = [
    // 建筑物
    { 
      id: 1, 
      x: 0, 
      y: 0, 
      block: 'BUILDING', 
      traffic: null, 
      event: null, 
      roadId: null, 
      updatedAt: '2025-01-15T10:00:00.000Z' 
    },
    { 
      id: 2, 
      x: 1, 
      y: 0, 
      block: 'BUILDING', 
      traffic: null, 
      event: null, 
      roadId: null, 
      updatedAt: '2025-01-15T10:00:00.000Z' 
    },
    { 
      id: 3, 
      x: 19, 
      y: 0, 
      block: 'BUILDING', 
      traffic: null, 
      event: null, 
      roadId: null, 
      updatedAt: '2025-01-15T10:00:00.000Z' 
    },
    
    // 畅通道路
    { 
      id: 101, 
      x: 5, 
      y: 7, 
      block: 'ROAD', 
      traffic: 'SMOOTH', 
      event: null, 
      roadId: 'R001', 
      updatedAt: '2025-01-15T10:30:00.000Z' 
    },
    { 
      id: 102, 
      x: 6, 
      y: 7, 
      block: 'ROAD', 
      traffic: 'SMOOTH', 
      event: null, 
      roadId: 'R001', 
      updatedAt: '2025-01-15T10:30:00.000Z' 
    },
    
    // 正常道路
    { 
      id: 103, 
      x: 7, 
      y: 7, 
      block: 'ROAD', 
      traffic: 'NORMAL', 
      event: null, 
      roadId: 'R001', 
      updatedAt: '2025-01-15T10:30:00.000Z' 
    },
    { 
      id: 104, 
      x: 8, 
      y: 7, 
      block: 'ROAD', 
      traffic: 'NORMAL', 
      event: null, 
      roadId: 'R001', 
      updatedAt: '2025-01-15T10:30:00.000Z' 
    },
    
    // 拥堵道路
    { 
      id: 105, 
      x: 9, 
      y: 7, 
      block: 'ROAD', 
      traffic: 'CONGESTED', 
      event: null, 
      roadId: 'R001', 
      updatedAt: '2025-01-15T10:35:00.000Z' 
    },
    { 
      id: 106, 
      x: 10, 
      y: 7, 
      block: 'ROAD', 
      traffic: 'CONGESTED', 
      event: null, 
      roadId: 'R001', 
      updatedAt: '2025-01-15T10:35:00.000Z' 
    },
    
    // 事故路段
    { 
      id: 107, 
      x: 11, 
      y: 7, 
      block: 'ROAD', 
      traffic: 'NORMAL', 
      event: 'ACCIDENT', 
      roadId: 'R001', 
      updatedAt: '2025-01-15T10:40:00.000Z' 
    },
    
    // 施工路段
    { 
      id: 201, 
      x: 9, 
      y: 8, 
      block: 'ROAD', 
      traffic: 'NORMAL', 
      event: 'CONSTRUCTION', 
      roadId: 'R002', 
      updatedAt: '2025-01-15T09:00:00.000Z' 
    },
    { 
      id: 202, 
      x: 9, 
      y: 9, 
      block: 'ROAD', 
      traffic: 'NORMAL', 
      event: 'CONSTRUCTION', 
      roadId: 'R002', 
      updatedAt: '2025-01-15T09:00:00.000Z' 
    },
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
  vehicles.value = []  // ✅ 清空车辆
  stopRealtimeUpdate()  // ✅ 停止定时器
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
  mapWidth.value = 160
  mapHeight.value = 160
  blockSize.value = 4
  ElMessage.success('已恢复默认设置')
}

/**
 * 处理地图块点击事件
 */
const handleBlockClick = (blockInfo) => {
  console.log('🖱️ 点击地图块:', blockInfo)
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
 * 获取块类型名称
 */
const getBlockTypeName = (type) => {
  const names = {
    empty: '空白区域',
    building: '建筑物',
    water: '水域',  // ✅ 新增
    normal: '普通道路',
    smooth: '畅通道路',
    congested: '拥堵路段',
    accident: '事故区域',
    construction: '施工区域',
    road_closure: '道路封闭'  // ✅ 新增
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
    road_closure: 'danger',  // ✅ 新增
    building: '',
    water: 'info'  // ✅ 新增
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
    road_closure: 0,  // ✅ 新增
    building: 0,
    water: 0  // ✅ 新增
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
  loadMapData()
  startRealtimeUpdate()  // 可选：自动启动车辆更新
})

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

.total-blocks-card {
  border-left: 4px solid #67B3DB;
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