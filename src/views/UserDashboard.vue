<template>
  <div class="user-dashboard">
    <!-- 侧边栏 -->
    <el-aside width="260px" class="sidebar">
      <div class="logo">
        <el-icon :size="32" color="#fff"><User /></el-icon>
        <h2>用户中心</h2>
      </div>

      <el-menu
        :default-active="currentTab"
        class="sidebar-menu"
        background-color="transparent"
        text-color="#fff"
        active-text-color="#FFFBDD"
        @select="switchTab"
      >
        <el-menu-item index="map">
          <el-icon><MapLocation /></el-icon>
          <span>我的地图</span>
        </el-menu-item>
        <el-menu-item index="query">
          <el-icon><Search /></el-icon>
          <span>实时查询</span>
        </el-menu-item>
        <el-menu-item index="route">
          <el-icon><Guide /></el-icon>
          <span>路线规划</span>
        </el-menu-item>
        <el-menu-item index="profile">
          <el-icon><User /></el-icon>
          <span>个人信息</span>
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
        <h1>用户仪表盘</h1>
        <el-dropdown>
          <div class="user-info">
            <el-avatar :size="35" style="background: #16a085; margin-right: 10px;">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span>用户</span>
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
        <!-- 我的地图 -->
        <div v-if="currentTab === 'map'" class="map-section">
          <!-- 标题和控制按钮 -->
          <div class="section-header">
            <h2>
              <el-icon><MapLocation /></el-icon>
              我的地图
            </h2>
            <el-space wrap>
              <el-button 
                :type="showDebug ? 'success' : 'info'" 
                @click="showDebug = !showDebug"
                :icon="showDebug ? View : Hide"
              >
                {{ showDebug ? '隐藏' : '显示' }}坐标
              </el-button>
              
              <!-- ✅ 修改按钮文案 -->
              <el-button 
                type="warning" 
                @click="simulateVehicleMovement" 
                :icon="Van"
              >
                {{ vehicles.length > 0 ? '移动我的车辆' : '显示我的车辆' }}
              </el-button>
              <el-button 
                type="success" 
                @click="startRealtimeUpdate" 
                :icon="VideoPlay"
                :disabled="vehicles.length === 0"
              >
                开始跟踪
              </el-button>
              <el-button 
                type="danger" 
                @click="stopRealtimeUpdate" 
                :icon="VideoPause"
              >
                停止跟踪
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
              <MapContainer
                :width="mapWidth"
                :height="mapHeight"
                :block-size="blockSize"
                :blocks="mapBlocks"
                :vehicles="vehicles"
                :show-debug="showDebug"
                :background-image="mapBackgroundImage"
                @block-click="handleBlockClick"
                @block-hover="handleBlockHover"
                @vehicle-click="handleVehicleClick"
                @vehicle-position-update="handleVehiclePositionUpdate"
              />
            </div>
          </el-card>

          <!-- 我的车辆信息弹窗 -->
          <el-dialog 
            v-model="showVehicleDialog" 
            title="我的车辆信息"  
            width="500px"
          >
            <el-descriptions :column="2" border v-if="selectedVehicle">
              <el-descriptions-item label="车牌号" :span="2">
                <el-tag type="success" size="large">{{ selectedVehicle.plateNumber }}</el-tag>  <!-- ✅ 改为绿色 -->
              </el-descriptions-item>
              <el-descriptions-item label="车辆类型">
                {{ getVehicleTypeName(selectedVehicle.type) }}
              </el-descriptions-item>
              <el-descriptions-item label="当前速度">
                <el-tag :type="getVehicleSpeedTagType(selectedVehicle.speed)">  <!-- ✅ 修改函数名 -->
                  {{ selectedVehicle.speed }} km/h
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="当前位置" :span="2">
                ({{ selectedVehicle.x }}, {{ selectedVehicle.y }})
              </el-descriptions-item>
              <el-descriptions-item label="行驶方向" :span="2">
                {{ getDirectionName(selectedVehicle.direction) }}
              </el-descriptions-item>
            </el-descriptions>
            
            <template #footer>
              <el-button type="success" @click="showVehicleDialog = false">
                确定
              </el-button>
            </template>
          </el-dialog>
          <!-- 统计卡片 -->
          <!-- <el-row :gutter="20" class="stats-row">
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
          </el-row> -->

          <!-- 地图块总数统计 -->
          <el-row :gutter="20">
            <el-col :span="24">
              <el-card shadow="hover" class="total-blocks-card">
                <el-statistic title="地图块总数" :value="mapBlocks.length">
                  <template #prefix>
                    <el-icon color="#16a085" :size="24"><Grid /></el-icon>
                  </template>
                  <template #suffix>
                    <span style="font-size: 16px; color: #999;">个</span>
                  </template>
                </el-statistic>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 实时查询 -->
        <div v-if="currentTab === 'query'">
          <el-card shadow="never">
            <template #header>
              <span><el-icon><Search /></el-icon> 实时查询</span>
            </template>
            <el-empty description="查询功能开发中" />
          </el-card>
        </div>

        <!-- 路线规划 -->
        <div v-if="currentTab === 'route'">
          <el-card shadow="never">
            <template #header>
              <span><el-icon><Guide /></el-icon> 路线规划</span>
            </template>
            <el-empty description="路线规划功能开发中" />
          </el-card>
        </div>

        <!-- 个人信息 -->
        <div v-if="currentTab === 'profile'">
          <el-card shadow="never">
            <template #header>
              <span><el-icon><User /></el-icon> 个人信息</span>
            </template>
            <el-empty description="个人信息功能开发中" />
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
        
        <el-descriptions-item label="通行速度" v-if="selectedBlock.data?.speed !== undefined">
          <el-tag :type="getSpeedTagType(selectedBlock.data.speed)">
            {{ selectedBlock.data.speed }} km/h
          </el-tag>
        </el-descriptions-item>
        
        <el-descriptions-item label="更新时间" v-if="selectedBlock.data?.updatedAt">
          {{ formatTime(selectedBlock.data.updatedAt) }}
        </el-descriptions-item>
        
        <el-descriptions-item label="区域名称" v-if="selectedBlock.data?.name">
          {{ selectedBlock.data.name }}
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User, MapLocation, Search, Guide, Back, ArrowDown, SwitchButton,
  Location, View, Hide, Refresh, RefreshLeft, Grid, Promotion, WarningFilled, Warning, Van
} from '@element-plus/icons-vue'
import MapContainer from '../components/map/MapContainer.vue'
import mapApi from '../api/map'
// import vehicleApi from '../api/vehicle'
import mapBgImage from '@/assets/bgi.png'

const router = useRouter()

// 当前选中的标签
const currentTab = ref('map')

// 地图配置
const mapWidth = ref(160)
const mapHeight = ref(160)
const blockSize = ref(4)
const showDebug = ref(false)

const mapBackgroundImage = ref(mapBgImage)

// 地图块数据
const mapBlocks = ref([])

// 加载状态
const loading = ref(false)

// ✅ 新增：加载进度
const loadingProgress = ref({
  current: 0,
  total: 25000,  // 预估总数
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
 * API 诊断函数
 */
const diagnosisAPI = async () => {
  console.log('🔧 开始 API 诊断...')
  
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
    console.log('  - items数量:', firstPage.items?.length || 0)
    console.log('  - nextCursor:', firstPage.nextCursor)
    console.log('  - hasNextPage:', firstPage.hasNextPage)
    
    if (firstPage.items && firstPage.items.length > 0) {
      console.log('  - 第一条数据示例:', firstPage.items[0])
    }
    
    // 3. 测试按坐标查询
    if (firstPage.items && firstPage.items.length > 0) {
      const testItem = firstPage.items[0]
      console.log(`3️⃣ 测试按坐标查询 /maps/${testItem.x}/${testItem.y}`)
      const coordData = await mapApi.getMapByCoord(testItem.x, testItem.y)
      console.log('✅ 坐标查询结果:', coordData)
    }
    
    // 4. 显示诊断结果
    const message = `
      ✅ API 诊断完成！
      
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
    ElMessage.error(`诊断失败: ${error.message}`)
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
 * 从后端获取用户自己的车辆位置
 */
const fetchVehiclesPosition = async () => {
  try {
    // ✅ 调用用户车辆 API（只获取当前用户的车辆）
    const data = await vehicleApi.getMyVehicle()
    
    // 只显示用户自己的车辆
    if (data && data.vehicle) {
      const v = data.vehicle
      vehicles.value = [{
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
      }]
      
      console.log(`✅ 已更新我的车辆位置: ${v.plateNumber}`)
    } else {
      vehicles.value = []
      console.log('当前没有车辆数据')
    }
  } catch (error) {
    console.error('获取车辆位置失败:', error)
    // 不显示错误提示，避免频繁弹窗
  }
}

/**
 * 模拟车辆移动（测试用 - 只显示用户自己的车）
 */
const simulateVehicleMovement = () => {
  if (vehicles.value.length === 0) {
    // 添加用户自己的测试车辆（只有一辆）
    vehicles.value = [
      {
        id: 1,
        plateNumber: '粤A88888',
        x: 7,
        y: 7,
        offsetX: 0,
        offsetY: 0,
        speed: 60,
        direction: 0,
        type: 'car',
        status: 'moving',
        showTrail: true,
        transitionDuration: 1000
      }
    ]
    ElMessage.success('已加载我的车辆')
  } else {
    // 移动用户的车辆
    const vehicle = vehicles.value[0]
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
    
    vehicles.value = [{
      ...vehicle,
      x: newX,
      y: newY,
      direction: move.angle,
      speed: Math.floor(Math.random() * 40) + 40
    }]
    ElMessage.info('车辆位置已更新')
  }
}

/**
 * 开始实时更新（定时轮询）
 */
const startRealtimeUpdate = () => {
  if (vehicles.value.length === 0) {
    ElMessage.warning('请先显示车辆')
    return
  }
  
  if (updateTimer) {
    ElMessage.warning('已在跟踪中')
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
  }, 500)  // ✅ 3000ms = 3秒轮询一次
  
  ElMessage.success('开始跟踪我的车辆（每3秒）')
}

/**
 * 停止实时更新
 */
const stopRealtimeUpdate = () => {
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
    ElMessage.info('已停止跟踪')
  } else {
    ElMessage.warning('当前未在跟踪')
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
 * 初始化地图
 */
const initMap = () => {
  mapBlocks.value = []
}

/**
 * 重置/清空地图
 */
const resetMap = () => {
  initMap()
  vehicles.value = []
  stopRealtimeUpdate()
  ElMessage.success('地图已清空')
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
  ElMessage.success('欢迎使用用户中心')
  // 自动加载地图数据
  loadMapData()
  startRealtimeUpdate()  // 可选：自动启动车辆更新
})

/**
 * 页面卸载时清理定时器
 */
onUnmounted(() => {
  stopRealtimeUpdate()
})
</script>

<style scoped>
.vehicle-stat-card {
  border-left: 4px solid #67B3DB;
}

.user-dashboard {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: #f0f2f5;
}

/* 侧边栏 - 绿色主题 */
.sidebar {
  background: linear-gradient(180deg, #16a085 0%, #1abc9c 100%);
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
  color: #16a085;
}

.back-btn:hover {
  background: white;
}

/* 主容器 */
.main-container {
  flex: 1;
}

/* 顶部栏 - 绿色主题 */
.top-bar {
  background: linear-gradient(135deg, #16a085 0%, #1abc9c 50%, #48c9b0 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
}

.top-bar h1 {
  color: white;
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
  color: #16a085;
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

/* 地图区域 */
.map-section {
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
  border: 2px solid #1abc9c;
}

.map-wrapper {
  display: flex;
  justify-content: center;
  padding: 10px;
}

/* 统计行 */
/* .stats-row {
  margin-bottom: 20px;
}

.stat-card {
  transition: all 0.3s;
  border-left: 4px solid #16a085;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(22, 160, 133, 0.2);
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
  border-left: 4px solid #16a085;
} */

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