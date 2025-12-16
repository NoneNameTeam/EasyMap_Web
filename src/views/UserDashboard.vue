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
              
              <!-- 实时监控按钮 -->
              <el-button 
                :type="isRealtimeEnabled ? 'danger' : 'success'" 
                @click="toggleRealtimeUpdate"
                :icon="isRealtimeEnabled ? VideoPause : VideoPlay"
              >
                {{ isRealtimeEnabled ? '停止监控' : '开始监控' }}
              </el-button>
              
              <!-- 路径规划按钮 -->
              <el-button 
                type="primary" 
                @click="openPathPlanningDialog" 
                :icon="Guide"
              >
                路径规划
              </el-button>

              <!-- 清除路径按钮 -->
              <el-button 
                v-if="highlightedPath.length > 0"
                type="warning" 
                @click="clearPath" 
                :icon="Close"
              >
                清除路径
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

          <!-- 实时监控状态条 -->
          <el-alert 
            v-if="isRealtimeEnabled"
            type="success"
            :closable="false"
            show-icon
            style="margin-bottom: 15px;"
          >
            <template #title>
              <span>
                 实时监控中 | 
                上次更新: {{ lastUpdateTimeDisplay }} | 
                道路总数: {{ congestionSummary.totalRoads }} | 
                畅通: {{ congestionSummary.smooth }} | 
                正常: {{ congestionSummary.normal }} | 
                拥堵: {{ congestionSummary.congested }} |
                 <!-- 交通灯: {{ trafficLights.length }} |
                 闸机: {{ parkingGates.length }} -->
              </span>
            </template>
          </el-alert>

          <!-- 图例 -->
          <el-card shadow="never" class="legend-card">
            <template #header>
              <span><el-icon><Grid /></el-icon> 图例说明</span>
            </template>
            <div class="legend">
              <el-tag type="success" effect="plain">
                <span class="legend-dot" style="background: #27ae60;"></span>
                畅通 / 规划路径
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
              <el-tag type="danger" effect="plain">
                <span class="legend-dot" style="background: #c0392b;"></span>
                道路封闭
              </el-tag>
              <el-tag color="#34495e" effect="plain">
                <span class="legend-dot" style="background: #34495e;"></span>
                建筑
              </el-tag>
              <el-tag type="info" effect="plain">
                <span class="legend-dot" style="background: #3498db;"></span>
                水域
              </el-tag>
              <!-- ✅ 新增：交通灯和闸机图例 -->
              <!-- <el-divider direction="vertical" /> -->
              <!-- <el-tag effect="dark" style="background: #2c2c2c;">
                🚦 交通灯
              </el-tag>
              <el-tag effect="dark" style="background: #555;">
                🚧 停车闸机
              </el-tag> -->
            </div>
          </el-card>

          <!-- ✅ 交通灯状态卡片 -->
          <!-- <el-card v-if="trafficLights.length > 0" shadow="hover" class="traffic-light-card">
            <template #header>
              <span>🚦 交通灯状态（实时）</span>
            </template>
            <div class="traffic-light-list">
              <div 
                v-for="light in trafficLights" 
                :key="light.id" 
                class="traffic-light-item"
              >
                <div class="light-info">
                  <span class="light-name">{{ light.name }}</span>
                  <span class="light-position">({{ light.x }}, {{ light.y }})</span>
                </div>
                <div class="light-status">
                  <span 
                    class="light-indicator"
                    :style="{ background: getTrafficLightColor(light.state) }"
                  ></span>
                  <span class="light-state">{{ getTrafficLightStateName(light.state) }}</span>
                  <el-tag 
                    :type="light.state === 'RED' ? 'danger' : light.state === 'GREEN' ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ light.remainingTime || 0 }}s
                  </el-tag>
                  <el-tag type="info" size="small" style="margin-left: 5px;">
                    {{ light.mode === 'AUTO' ? '自动' : '手动' }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>

          ✅ 停车场闸机状态卡片 -->
          <!-- <el-card v-if="parkingGates.length > 0" shadow="hover" class="parking-gate-card">
            <template #header>
              <span>🚧 停车场闸机状态</span>
            </template>
            <div class="parking-gate-list">
              <div 
                v-for="gate in parkingGates" 
                :key="gate.id" 
                class="parking-gate-item"
              >
                <div class="gate-info">
                  <span class="gate-name">{{ gate.name }}</span>
                  <span class="gate-position">({{ gate.x }}, {{ gate.y }})</span>
                </div>
                <div class="gate-status">
                  <el-tag 
                    :type="getParkingGateTagType(gate.state)"
                    effect="dark"
                  >
                    {{ getParkingGateStateName(gate.state) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card> -->

          <!-- 地图容器 -->
          <el-card shadow="hover" class="map-card">
            <div class="map-wrapper">
              <CanvasMapContainer
                :width="mapWidth"
                :height="mapHeight"
                :block-size="blockSize"
                :blocks="mapBlocks"
                :vehicles="[]"
                :show-debug="showDebug"
                :background-image="backgroundImage"
                :highlighted-path="highlightedPath"
                :select-mode="selectMode"
                :start-point="startPoint"
                :end-point="endPoint"
                :traffic-lights="trafficLights"
                :parking-gates="parkingGates"
                @block-click="handleBlockClick"
                @block-hover="handleBlockHover"
                @point-select="handlePointSelect"
                @traffic-light-click="handleTrafficLightClick"
                @parking-gate-click="handleParkingGateClick"
              />
            </div>
          </el-card>

          <!-- 路径信息卡片 -->
          <el-card v-if="pathInfo" shadow="hover" class="path-info-card">
            <template #header>
              <span><el-icon><Guide /></el-icon> 路径规划结果</span>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="起点">
                ({{ startPoint?.x }}, {{ startPoint?.y }})
              </el-descriptions-item>
              <el-descriptions-item label="终点">
                ({{ endPoint?.x }}, {{ endPoint?.y }})
              </el-descriptions-item>
              <el-descriptions-item label="路径距离">
                <el-tag type="info">{{ pathInfo.distance?.toFixed(2) || '-' }} 米</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="预计时间">
                <el-tag type="success">{{ pathInfo.estimatedTime?.toFixed(2) || '-' }} 分钟</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="途经道路" :span="2">
                <el-tag 
                  v-for="road in pathInfo.roads" 
                  :key="road.id" 
                  type="primary" 
                  style="margin-right: 5px;"
                >
                  {{ road.name }}
                </el-tag>
                <span v-if="!pathInfo.roads?.length">-</span>
              </el-descriptions-item>
              <el-descriptions-item label="关键点数量">
                {{ pathInfo.keyPointCount || highlightedPath.length }} 个
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 道路拥堵状态列表 -->
          <el-card v-if="roadCongestionList.length > 0" shadow="hover" class="congestion-list-card">
            <template #header>
              <div class="card-header-with-action">
                <span><el-icon><Warning /></el-icon> 道路拥堵状态</span>
                <el-button size="small" type="primary" text @click="fetchCongestionOverview">
                  <el-icon><Refresh /></el-icon> 刷新
                </el-button>
              </div>
            </template>
            <el-table :data="roadCongestionList" style="width: 100%" max-height="300">
              <el-table-column prop="roadName" label="道路名称" min-width="120" />
              <el-table-column prop="trafficLevel" label="交通状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getTrafficLevelTagType(row.trafficLevel)" size="small">
                    {{ getTrafficLevelName(row.trafficLevel) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="vehicleCount" label="车辆数" width="80" />
              <el-table-column prop="congestionPercentage" label="拥堵率" width="100">
                <template #default="{ row }">
                  <el-progress 
                    :percentage="row.congestionPercentage" 
                    :color="getCongestionColor(row.congestionPercentage)"
                    :stroke-width="10"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button 
                    type="primary" 
                    size="small" 
                    text 
                    @click="showRoadDetail(row.roadId)"
                  >
                    详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

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
        <el-descriptions-item label="事件" v-if="selectedBlock.data?.event && selectedBlock.data.event !== 'NONE'">
          <el-tag type="warning" effect="dark">
            {{ getEventName(selectedBlock.data.event) }}
          </el-tag>
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

    <!-- 路径规划弹窗 -->
    <el-dialog 
      v-model="showPathDialog" 
      title="路径规划" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="pathForm" label-width="100px">
        <el-form-item label="起点">
          <el-input 
            :value="startPoint ? `(${startPoint.x}, ${startPoint.y})` : '未选择'" 
            readonly
            placeholder="请在地图上点击选择起点"
          >
            <template #append>
              <el-button 
                :type="selectMode === 'start' ? 'success' : 'primary'"
                @click="startSelectPoint('start')"
              >
                {{ selectMode === 'start' ? '选择中...' : '选择' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="终点">
          <el-input 
            :value="endPoint ? `(${endPoint.x}, ${endPoint.y})` : '未选择'" 
            readonly
            placeholder="请在地图上点击选择终点"
          >
            <template #append>
              <el-button 
                :type="selectMode === 'end' ? 'danger' : 'primary'"
                @click="startSelectPoint('end')"
              >
                {{ selectMode === 'end' ? '选择中...' : '选择' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="规划选项">
          <el-checkbox v-model="pathForm.considerTraffic">考虑实时交通</el-checkbox>
          <el-checkbox v-model="pathForm.avoidEvents">避开事故/施工</el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cancelPathPlanning">取消</el-button>
        <el-button 
          type="primary" 
          @click="submitPathPlanning"
          :loading="pathLoading"
          :disabled="!startPoint || !endPoint"
        >
          开始规划
        </el-button>
      </template>
    </el-dialog>

    <!-- 道路详情弹窗 -->
    <el-dialog 
      v-model="showRoadDetailDialog" 
      title="道路拥堵详情" 
      width="600px"
    >
      <div v-loading="roadDetailLoading">
        <el-descriptions :column="2" border v-if="selectedRoadDetail">
          <el-descriptions-item label="道路名称" :span="2">
            <el-tag type="primary" size="large">{{ selectedRoadDetail.roadName }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="道路描述" :span="2">
            {{ selectedRoadDetail.description || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="交通状态">
            <el-tag :type="getTrafficLevelTagType(selectedRoadDetail.trafficLevel)">
              {{ getTrafficLevelName(selectedRoadDetail.trafficLevel) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="平均速度">
            {{ selectedRoadDetail.averageSpeed }} km/h
          </el-descriptions-item>
          <el-descriptions-item label="车辆数量">
            {{ selectedRoadDetail.vehicleCount }} 辆
          </el-descriptions-item>
          <el-descriptions-item label="节点数量">
            {{ selectedRoadDetail.nodeCount }} 个
          </el-descriptions-item>
          <el-descriptions-item label="拥堵率" :span="2">
            <el-progress 
              :percentage="selectedRoadDetail.congestionPercentage" 
              :color="getCongestionColor(selectedRoadDetail.congestionPercentage)"
              :stroke-width="20"
              :format="(p) => p + '%'"
            />
          </el-descriptions-item>
          <el-descriptions-item label="有事件" :span="2">
            <el-tag :type="selectedRoadDetail.hasEvents ? 'danger' : 'success'">
              {{ selectedRoadDetail.hasEvents ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="交通分布" :span="2">
            <div class="traffic-distribution">
              <el-tag type="success" style="margin-right: 10px;">
                畅通: {{ selectedRoadDetail.trafficDistribution?.SMOOTH || 0 }}%
              </el-tag>
              <el-tag type="info" style="margin-right: 10px;">
                正常: {{ selectedRoadDetail.trafficDistribution?.NORMAL || 0 }}%
              </el-tag>
              <el-tag type="danger" style="margin-right: 10px;">
                拥堵: {{ selectedRoadDetail.trafficDistribution?.CONGESTED || 0 }}%
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="最后更新" :span="2">
            {{ formatTime(selectedRoadDetail.lastUpdated) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <template #footer>
        <el-button @click="showRoadDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="highlightRoadOnMap">
          在地图上高亮
        </el-button>
      </template>
    </el-dialog>

    <!-- ✅ 交通灯信息弹窗（只读） -->
    <!-- <el-dialog 
      v-model="showTrafficLightDialog" 
      title="🚦 交通灯信息"
      width="400px"
    >
      <el-descriptions :column="1" border v-if="selectedTrafficLight">
        <el-descriptions-item label="名称">
          {{ selectedTrafficLight.name }}
        </el-descriptions-item>
        <el-descriptions-item label="ID">
          {{ selectedTrafficLight.id }}
        </el-descriptions-item>
        <el-descriptions-item label="位置">
          ({{ selectedTrafficLight.x }}, {{ selectedTrafficLight.y }})
        </el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag 
            :type="selectedTrafficLight.state === 'RED' ? 'danger' : selectedTrafficLight.state === 'GREEN' ? 'success' : 'warning'"
            effect="dark"
            size="large"
          >
            {{ getTrafficLightStateName(selectedTrafficLight.state) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="剩余时间">
          <span style="font-size: 24px; font-weight: bold; color: #409EFF;">
            {{ selectedTrafficLight.remainingTime || 0 }}
          </span> 秒
        </el-descriptions-item>
        <el-descriptions-item label="持续时间">
          {{ selectedTrafficLight.duration }} 秒
        </el-descriptions-item>
        <el-descriptions-item label="模式">
          <el-tag :type="selectedTrafficLight.mode === 'AUTO' ? 'success' : 'warning'">
            {{ selectedTrafficLight.mode === 'AUTO' ? '自动模式' : '手动模式' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="所属道路">
          {{ selectedTrafficLight.roadId || '-' }}
        </el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <el-button type="primary" @click="showTrafficLightDialog = false">关闭</el-button>
      </template>
    </el-dialog> -->

    <!-- ✅ 停车场闸机信息弹窗（只读） -->
    <!-- <el-dialog 
      v-model="showParkingGateDialog" 
      title="🚧 停车场闸机信息"
      width="400px"
    >
      <el-descriptions :column="1" border v-if="selectedParkingGate">
        <el-descriptions-item label="名称">
          {{ selectedParkingGate.name }}
        </el-descriptions-item>
        <el-descriptions-item label="ID">
          {{ selectedParkingGate.id }}
        </el-descriptions-item>
        <el-descriptions-item label="位置">
          ({{ selectedParkingGate.x }}, {{ selectedParkingGate.y }})
        </el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag 
            :type="getParkingGateTagType(selectedParkingGate.state)"
            effect="dark"
            size="large"
          >
            {{ getParkingGateStateName(selectedParkingGate.state) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="所属停车场">
          {{ selectedParkingGate.parkingLotId || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="上次开启" v-if="selectedParkingGate.lastOpened">
          {{ formatTime(selectedParkingGate.lastOpened) }}
        </el-descriptions-item>
        <el-descriptions-item label="上次关闭" v-if="selectedParkingGate.lastClosed">
          {{ formatTime(selectedParkingGate.lastClosed) }}
        </el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <el-button type="primary" @click="showParkingGateDialog = false">关闭</el-button>
      </template>
    </el-dialog> -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User, MapLocation, Back, ArrowDown, SwitchButton,
  View, Hide, Refresh, RefreshLeft, Grid, Guide, Close,
  VideoPlay, VideoPause, Warning
} from '@element-plus/icons-vue'
import CanvasMapContainer from '../components/map/CanvasMapContainer.vue'
import mapApi from '../api/map'
import pathApi from '../api/path'
import roadApi from '../api/road'
import trafficApi from '../api/traffic'  // ✅ 新增
import parkingApi from '../api/parking'  // ✅ 新增
import mapBg from '@/assets/bgi.png'

const router = useRouter()

// 当前选中的标签
const currentTab = ref('map')

// 地图配置
const mapWidth = ref(120)
const mapHeight = ref(120)
const blockSize = ref(5)
const showDebug = ref(false)

const backgroundImage = ref(mapBg)

// 地图块数据
const mapBlocks = ref([])

// 加载状态
const loading = ref(false)

// 加载进度
const loadingProgress = ref({
  current: 0,
  total: 25000,
  percentage: 0,
  pageCount: 0
})

// 选中的块
const selectedBlock = ref(null)
const showBlockDialog = ref(false)

// 路径规划相关
const showPathDialog = ref(false)
const pathLoading = ref(false)
const selectMode = ref(null)
const startPoint = ref(null)
const endPoint = ref(null)
const highlightedPath = ref([])
const pathInfo = ref(null)

const pathForm = ref({
  considerTraffic: true,
  avoidEvents: true
})

// 实时监控相关
let congestionUpdateTimer = null
const isRealtimeEnabled = ref(false)
const lastUpdateTime = ref(null)
const roadCongestionList = ref([])
const congestionSummary = ref({
  totalRoads: 0,
  smooth: 0,
  normal: 0,
  congested: 0,
  unknown: 0
})

// 道路详情相关
const showRoadDetailDialog = ref(false)
const roadDetailLoading = ref(false)
const selectedRoadDetail = ref(null)

// ✅ 交通灯相关
const trafficLights = ref([])
const showTrafficLightDialog = ref(false)
const selectedTrafficLight = ref(null)
let trafficLightTimer = null

// ✅ 停车场闸机相关
const parkingGates = ref([])
const showParkingGateDialog = ref(false)
const selectedParkingGate = ref(null)
let parkingGateTimer = null

// 计算上次更新时间显示
const lastUpdateTimeDisplay = computed(() => {
  if (!lastUpdateTime.value) return '无'
  return new Date(lastUpdateTime.value).toLocaleTimeString('zh-CN')
})

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
  
  loadingProgress.value = {
    current: 0,
    total: 25000,
    percentage: 0,
    pageCount: 0
  }
  
  try {
    console.log('📍 开始加载地图数据...')
    
    const data = await mapApi.getAllMapData({}, (count, hasMore, pageCount) => {
      loadingProgress.value = {
        current: count,
        total: 25000,
        percentage: Math.min((count / 25000) * 100, 99),
        pageCount: pageCount
      }
    })
    
    if (!data || data.length === 0) {
      ElMessage.warning('后端返回的地图数据为空')
      loadingProgress.value.percentage = 100
      return
    }
    
    mapBlocks.value = processMapData(data)
    
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
  } finally {
    loading.value = false
  }
}

/**
 * 处理后端返回的地图数据
 */
const processMapData = (data) => {
  if (!Array.isArray(data)) {
    return []
  }
  
  const processed = data.map((block) => {
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
        updatedAt: block.updatedAt,
        name: getBlockName(type, block)
      }
    }
  })
  
  return processed.filter(block => {
    return block.x >= 0 && block.x < mapWidth.value &&
           block.y >= 0 && block.y < mapHeight.value
  })
}

/**
 * 获取地图块名称
 */
const getBlockName = (type, block) => {
  if (type === 'building') return '建筑物'
  if (type === 'water') return '水域'
  if (type === 'road_closure') return '道路封闭'
  if (block.roadId) return `道路 ${block.roadId}`
  return '区域'
}

// ============ ✅ 交通灯相关方法 ============

/**
 * 获取所有交通灯
 */
const fetchTrafficLights = async () => {
  try {
    console.log('🚦 获取交通灯数据...')
    const data = await trafficApi.getAll()
    trafficLights.value = data || []
    console.log(`✅ 获取到 ${trafficLights.value.length} 个交通灯`)
  } catch (error) {
    console.error('❌ 获取交通灯失败:', error)
  }
}

/**
 * 开始交通灯轮询
 */
const startTrafficLightPolling = () => {
  if (trafficLightTimer) return
  
  fetchTrafficLights()
  trafficLightTimer = setInterval(() => {
    fetchTrafficLights()
  }, 500)  // 每2秒刷新（更快地更新剩余时间）
  
  console.log('🚦 开始交通灯状态轮询（每2秒）')
}

/**
 * 停止交通灯轮询
 */
const stopTrafficLightPolling = () => {
  if (trafficLightTimer) {
    clearInterval(trafficLightTimer)
    trafficLightTimer = null
    console.log('🚦 停止交通灯状态轮询')
  }
}

/**
 * 处理交通灯点击（只读查看）
 */
const handleTrafficLightClick = (light) => {
  selectedTrafficLight.value = light
  showTrafficLightDialog.value = true
}

/**
 * 获取交通灯颜色
 */
const getTrafficLightColor = (state) => {
  const colors = {
    RED: '#e74c3c',
    YELLOW: '#f1c40f',
    GREEN: '#27ae60'
  }
  return colors[state] || '#95a5a6'
}

/**
 * 获取交通灯状态名称
 */
const getTrafficLightStateName = (state) => {
  const names = {
    RED: '红灯',
    YELLOW: '黄灯',
    GREEN: '绿灯'
  }
  return names[state] || state
}

// ============ ✅ 停车场闸机相关方法 ============

/**
 * 获取所有停车场闸机
 */
const fetchParkingGates = async () => {
  try {
    console.log('🚧 获取停车场闸机数据...')
    const data = await parkingApi.getAll()
    parkingGates.value = data || []
    console.log(`✅ 获取到 ${parkingGates.value.length} 个停车场闸机`)
  } catch (error) {
    console.error('❌ 获取停车场闸机失败:', error)
  }
}

/**
 * 开始停车场闸机轮询
 */
const startParkingGatePolling = () => {
  if (parkingGateTimer) return
  
  fetchParkingGates()
  parkingGateTimer = setInterval(() => {
    fetchParkingGates()
  }, 3000)  // 每3秒刷新
  
  console.log('🚧 开始停车场闸机状态轮询（每3秒）')
}

/**
 * 停止停车场闸机轮询
 */
const stopParkingGatePolling = () => {
  if (parkingGateTimer) {
    clearInterval(parkingGateTimer)
    parkingGateTimer = null
    console.log('🚧 停止停车场闸机状态轮询')
  }
}

/**
 * 处理停车场闸机点击（只读查看）
 */
const handleParkingGateClick = (gate) => {
  selectedParkingGate.value = gate
  showParkingGateDialog.value = true
}

/**
 * 获取停车场闸机状态名称
 */
const getParkingGateStateName = (state) => {
  const names = {
    OPEN: '已开启',
    CLOSED: '已关闭',
    OPENING: '正在开启',
    CLOSING: '正在关闭'
  }
  return names[state] || state
}

/**
 * 获取停车场闸机标签类型
 */
const getParkingGateTagType = (state) => {
  const types = {
    OPEN: 'success',
    CLOSED: 'danger',
    OPENING: 'warning',
    CLOSING: 'warning'
  }
  return types[state] || 'info'
}

// ============ 道路拥堵相关方法 ============

/**
 * 获取道路拥堵概览
 */
const fetchCongestionOverview = async () => {
  try {
    console.log('🔄 获取道路拥堵概览...')
    const data = await roadApi.getCongestionOverview()
    
    if (data) {
      roadCongestionList.value = data.overview || []
      
      congestionSummary.value = {
        totalRoads: data.totalRoads || 0,
        smooth: data.summary?.smooth || 0,
        normal: data.summary?.normal || 0,
        congested: data.summary?.congested || 0,
        unknown: data.summary?.unknown || 0
      }
      
      lastUpdateTime.value = new Date().toISOString()
      
      console.log(`✅ 拥堵概览更新完成，共 ${roadCongestionList.value.length} 条道路`)
      
      updateMapBlocksFromCongestion(data.overview)
    }
  } catch (error) {
    console.error('❌ 获取拥堵概览失败:', error)
  }
}

/**
 * 根据拥堵数据更新地图块
 */
const updateMapBlocksFromCongestion = async (congestionData) => {
  if (!congestionData || congestionData.length === 0) return
  
  for (const road of congestionData) {
    try {
      const roadDetail = await roadApi.getRoadCongestion(road.roadId)
      
      if (roadDetail && roadDetail.nodes) {
        updateBlocksWithNodes(roadDetail.nodes)
      }
    } catch (error) {
      console.error(`获取道路 ${road.roadId} 详情失败:`, error)
    }
  }
}

/**
 * 使用节点数据更新地图块
 */
const updateBlocksWithNodes = (nodes) => {
  if (!nodes || nodes.length === 0) return
  
  const blockMap = new Map()
  
  mapBlocks.value.forEach(block => {
    blockMap.set(`${block.x},${block.y}`, block)
  })
  
  nodes.forEach(node => {
    const key = `${node.x},${node.y}`
    const existingBlock = blockMap.get(key)
    
    if (existingBlock) {
      let newType = existingBlock.type
      
      if (node.event && node.event !== 'NONE') {
        const eventMap = {
          'ACCIDENT': 'accident',
          'CONSTRUCTION': 'construction',
          'ROAD_CLOSURE': 'road_closure'
        }
        newType = eventMap[node.event] || existingBlock.type
      } else if (node.traffic) {
        const trafficMap = {
          'SMOOTH': 'smooth',
          'NORMAL': 'normal',
          'CONGESTED': 'congested'
        }
        newType = trafficMap[node.traffic] || existingBlock.type
      }
      
      blockMap.set(key, {
        ...existingBlock,
        type: newType,
        data: {
          ...existingBlock.data,
          traffic: node.traffic,
          event: node.event,
          updatedAt: node.updatedAt
        }
      })
    }
  })
  
  mapBlocks.value = Array.from(blockMap.values())
}

/**
 * 切换实时监控
 */
const toggleRealtimeUpdate = () => {
  if (isRealtimeEnabled.value) {
    stopRealtimeUpdate()
  } else {
    startRealtimeUpdate()
  }
}

/**
 * 开始实时监控
 */
const startRealtimeUpdate = () => {
  if (congestionUpdateTimer) {
    ElMessage.warning('已在监控中')
    return
  }
  
  isRealtimeEnabled.value = true
  
  // 立即执行一次
  fetchCongestionOverview()
  
  // 每 5 秒轮询道路拥堵
  congestionUpdateTimer = setInterval(() => {
    fetchCongestionOverview()
  }, 5000)
  
  // ✅ 同时开始交通灯和闸机轮询
  startTrafficLightPolling()
  startParkingGatePolling()
  
  ElMessage.success('开始实时监控')
}

/**
 * 停止实时监控
 */
const stopRealtimeUpdate = () => {
  if (congestionUpdateTimer) {
    clearInterval(congestionUpdateTimer)
    congestionUpdateTimer = null
  }
  
  // ✅ 同时停止交通灯和闸机轮询
  stopTrafficLightPolling()
  stopParkingGatePolling()
  
  isRealtimeEnabled.value = false
  ElMessage.info('已停止实时监控')
}

/**
 * 显示道路详情
 */
const showRoadDetail = async (roadId) => {
  showRoadDetailDialog.value = true
  roadDetailLoading.value = true
  
  try {
    const data = await roadApi.getRoadCongestion(roadId)
    selectedRoadDetail.value = data
  } catch (error) {
    console.error('获取道路详情失败:', error)
    ElMessage.error('获取道路详情失败')
  } finally {
    roadDetailLoading.value = false
  }
}

/**
 * 在地图上高亮道路
 */
const highlightRoadOnMap = () => {
  if (!selectedRoadDetail.value || !selectedRoadDetail.value.nodes) {
    ElMessage.warning('没有可高亮的节点')
    return
  }
  
  highlightedPath.value = selectedRoadDetail.value.nodes.map(node => ({
    x: node.x,
    y: node.y
  }))
  
  showRoadDetailDialog.value = false
  ElMessage.success(`已高亮 ${highlightedPath.value.length} 个节点`)
}

/**
 * 获取交通等级标签类型
 */
const getTrafficLevelTagType = (level) => {
  const typeMap = {
    'SMOOTH': 'success',
    'NORMAL': 'info',
    'CONGESTED': 'danger',
    'UNKNOWN': 'warning'
  }
  return typeMap[level] || 'info'
}

/**
 * 获取交通等级名称
 */
const getTrafficLevelName = (level) => {
  const nameMap = {
    'SMOOTH': '畅通',
    'NORMAL': '正常',
    'CONGESTED': '拥堵',
    'UNKNOWN': '未知'
  }
  return nameMap[level] || level
}

/**
 * 获取拥堵率颜色
 */
const getCongestionColor = (percentage) => {
  if (percentage < 30) return '#67C23A'
  if (percentage < 60) return '#E6A23C'
  return '#F56C6C'
}

/**
 * 格式化时间
 */
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}

// ============ 路径规划相关方法 ============

/**
 * 打开路径规划对话框
 */
const openPathPlanningDialog = () => {
  showPathDialog.value = true
}

/**
 * 开始选择点
 */
const startSelectPoint = (type) => {
  selectMode.value = type
  showPathDialog.value = false
  ElMessage.info(`请在地图上点击选择${type === 'start' ? '起点' : '终点'}`)
}

/**
 * 处理地图点选择
 */
const handlePointSelect = (pointInfo) => {
  const { x, y, type } = pointInfo
  
  if (type === 'start') {
    startPoint.value = { x, y }
    ElMessage.success(`起点已选择: (${x}, ${y})`)
  } else if (type === 'end') {
    endPoint.value = { x, y }
    ElMessage.success(`终点已选择: (${x}, ${y})`)
  }
  
  selectMode.value = null
  showPathDialog.value = true
}

/**
 * 取消路径规划
 */
const cancelPathPlanning = () => {
  showPathDialog.value = false
  selectMode.value = null
}

/**
 * 提交路径规划
 */
const submitPathPlanning = async () => {
  if (!startPoint.value || !endPoint.value) {
    ElMessage.warning('请先选择起点和终点')
    return
  }
  
  pathLoading.value = true
  
  try {
    const requestData = {
      startX: startPoint.value.x,
      startY: startPoint.value.y,
      targetX: endPoint.value.x,
      targetY: endPoint.value.y,
      considerTraffic: pathForm.value.considerTraffic,
      avoidEvents: pathForm.value.avoidEvents,
      preferredSpeed: 50
    }
    
    const result = await pathApi.calculateRoute(requestData)
    
    if (result && result.path && result.path.length > 0) {
      highlightedPath.value = result.path.map(point => ({
        x: Math.round(point.x),
        y: Math.round(point.y)
      }))
      
      pathInfo.value = {
        distance: result.distance,
        estimatedTime: result.estimatedTime,
        roads: result.roads || [],
        keyPointCount: result.keyPointCount || result.path.length
      }
      
      ElMessage.success(`路径规划成功！共 ${highlightedPath.value.length} 个关键点`)
      showPathDialog.value = false
    } else {
      ElMessage.warning('未找到可用路径')
    }
  } catch (error) {
    console.error('❌ 路径规划失败:', error)
    ElMessage.error(`路径规划失败: ${error.message}`)
  } finally {
    pathLoading.value = false
  }
}

/**
 * 清除路径
 */
const clearPath = () => {
  highlightedPath.value = []
  pathInfo.value = null
  startPoint.value = null
  endPoint.value = null
  ElMessage.success('已清除路径')
}

// ============ 地图基础方法 ============

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
  clearPath()
  stopRealtimeUpdate()
  roadCongestionList.value = []
  trafficLights.value = []      // ✅ 清空交通灯
  parkingGates.value = []       // ✅ 清空闸机
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
    water: '水域',
    normal: '普通道路',
    smooth: '畅通道路',
    congested: '拥堵路段',
    accident: '事故区域',
    construction: '施工区域',
    road_closure: '道路封闭'
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
    road_closure: 'danger',
    building: '',
    water: 'info'
  }
  return types[type] || 'info'
}

/**
 * 获取交通状况标签类型
 */
const getTrafficTagType = (traffic) => {
  const typeMap = {
    'SMOOTH': 'success',
    'NORMAL': 'info',
    'CONGESTED': 'danger',
    'UNKNOWN': 'warning'
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
    'UNKNOWN': '未知'
  }
  return nameMap[traffic] || traffic
}

/**
 * 获取事件名称
 */
const getEventName = (event) => {
  const nameMap = {
    'NONE': '无事件',
    'ACCIDENT': '交通事故',
    'CONSTRUCTION': '道路施工',
    'ROAD_CLOSURE': '道路封闭'
  }
  return nameMap[event] || event
}

// ============ 生命周期 ============

/**
 * 页面加载时初始化
 */
onMounted(() => {
  ElMessage.success('欢迎使用用户中心')
  loadMapData()
  // ✅ 自动开始实时监控（包含交通灯和闸机）
  startRealtimeUpdate()
})

/**
 * 页面卸载时清理
 */
onUnmounted(() => {
  stopRealtimeUpdate()
})
</script>

<style scoped>
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
  align-items: center;
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

/* 路径信息卡片 */
.path-info-card {
  margin-bottom: 20px;
  border-left: 4px solid #27ae60;
}

/* 拥堵列表卡片 */
.congestion-list-card {
  margin-bottom: 20px;
  border-left: 4px solid #e67e22;
}

.card-header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.traffic-distribution {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.total-blocks-card {
  border-left: 4px solid #16a085;
}

/* ✅ 交通灯状态卡片 */
.traffic-light-card {
  margin-bottom: 20px;
  border-left: 4px solid #f1c40f;
}

.traffic-light-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.traffic-light-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 8px;
  min-width: 280px;
  flex: 1;
  max-width: 400px;
  transition: all 0.3s;
}

.traffic-light-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.light-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.light-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.light-position {
  font-size: 12px;
  color: #7f8c8d;
}

.light-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.light-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
  animation: glow 1.5s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    box-shadow: 0 0 5px currentColor;
  }
  to {
    box-shadow: 0 0 15px currentColor, 0 0 20px currentColor;
  }
}

.light-state {
  font-weight: 500;
  font-size: 13px;
}

/* ✅ 停车场闸机状态卡片 */
.parking-gate-card {
  margin-bottom: 20px;
  border-left: 4px solid #e67e22;
}

.parking-gate-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.parking-gate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 8px;
  min-width: 250px;
  flex: 1;
  max-width: 350px;
  transition: all 0.3s;
}

.parking-gate-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.gate-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gate-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.gate-position {
  font-size: 12px;
  color: #7f8c8d;
}

.gate-status {
  display: flex;
  align-items: center;
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

  .traffic-light-item,
  .parking-gate-item {
    min-width: 100%;
    max-width: 100%;
  }

  .traffic-light-list,
  .parking-gate-list {
    flex-direction: column;
  }
}
</style>