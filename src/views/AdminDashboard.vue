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
              
              <!-- ✅ 实时监控按钮 -->
              <el-button 
                :type="isRealtimeEnabled ? 'danger' : 'success'" 
                @click="toggleRealtimeUpdate"
                :icon="isRealtimeEnabled ? VideoPause : VideoPlay"
              >
                {{ isRealtimeEnabled ? '停止监控' : '开始监控' }}
              </el-button>

              <!-- ✅ 调控红绿灯按钮 -->
              <el-button 
                type="success" 
                @click="openTrafficLightControl"
                :icon="Sunny"
              >
                调控红绿灯
              </el-button>
              
              <!-- 车辆控制按钮 -->
              <el-button 
                type="warning" 
                @click="simulateVehicleMovement" 
                :icon="Van"
              >
                移动车辆
              </el-button>
              
              <el-button 
                type="primary" 
                @click="loadMapData" 
                :icon="Refresh"
                :loading="loading"
              >
                刷新地图
              </el-button>

              <!-- 诊断按钮 -->
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

          <!-- ✅ 实时监控状态条 -->
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
                拥堵: {{ congestionSummary.congested }}
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
                :highlighted-path="highlightedPath"
                :traffic-lights="trafficLights"
                :parking-gates="parkingGates"
                @block-click="handleBlockClick"
                @block-hover="handleBlockHover"
                @vehicle-click="handleVehicleClick"
                @traffic-light-click="handleTrafficLightClick"
                @parking-gate-click="handleParkingGateClick"
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

          <!-- ✅ 道路拥堵状态列表 -->
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
              <el-table-column prop="congestionPercentage" label="拥堵率" width="120">
                <template #default="{ row }">
                  <el-progress 
                    :percentage="row.congestionPercentage || 0" 
                    :color="getCongestionColor(row.congestionPercentage || 0)"
                    :stroke-width="10"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
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
        <el-descriptions-item label="更新时间" v-if="selectedBlock.data?.updatedAt">
          {{ formatTime(selectedBlock.data.updatedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="区域名称" v-if="selectedBlock.data?.name">
          {{ selectedBlock.data.name }}
        </el-descriptions-item>
      </el-descriptions>
        </el-dialog>

        <!-- ✅ 交通灯选择弹窗 -->
    <el-dialog 
      v-model="showTrafficLightControlDialog" 
      title="选择交通灯"
      width="600px"
    >
      <el-table :data="trafficLights" style="width: 100%">
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="id" label="ID" width="120" />
        <el-table-column label="位置" width="100">
          <template #default="{ row }">
            ({{ row.x }}, {{ row.y }})
          </template>
        </el-table-column>
        <el-table-column prop="state" label="当前状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getTrafficLightTagType(row.state)" effect="dark">
              {{ getTrafficLightStateName(row.state) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click="selectTrafficLightForControl(row)"
            >
              调控
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <template #footer>
        <el-button @click="showTrafficLightControlDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ✅ 交通灯调控弹窗 -->
    <el-dialog 
      v-model="showTrafficLightDialog" 
      title="调控交通灯"
      width="450px"
    >
      <el-descriptions :column="1" border v-if="selectedTrafficLight">
        <el-descriptions-item label="名称">
          {{ selectedTrafficLight.name }}
        </el-descriptions-item>
        <el-descriptions-item label="位置">
          ({{ selectedTrafficLight.x }}, {{ selectedTrafficLight.y }})
        </el-descriptions-item>
        <el-descriptions-item label="所属道路">
          {{ selectedTrafficLight.roadId || '-' }}
        </el-descriptions-item>
      </el-descriptions>
      
      <el-divider>设置状态</el-divider>
      
      <el-form :model="trafficLightForm" label-width="100px">
        <el-form-item label="灯光状态">
          <el-radio-group v-model="trafficLightForm.state" size="large">
            <el-radio-button value="RED">
              <span style="color: #e74c3c;">🔴 红灯</span>
            </el-radio-button>
            <el-radio-button value="YELLOW">
              <span style="color: #f1c40f;">🟡 黄灯</span>
            </el-radio-button>
            <el-radio-button value="GREEN">
              <span style="color: #27ae60;">🟢 绿灯</span>
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="持续时间">
          <el-input-number 
            v-model="trafficLightForm.duration" 
            :min="5" 
            :max="300" 
            :step="5"
          />
          <span style="margin-left: 10px; color: #999;">秒</span>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showTrafficLightDialog = false">取消</el-button>
        <el-button type="primary" @click="updateTrafficLightState">
          确认更新
        </el-button>
      </template>
    </el-dialog>

    <!-- ✅ 停车场闸机控制弹窗 -->
    <el-dialog 
      v-model="showParkingGateDialog" 
      title="控制停车场闸机"
      width="450px"
    >
      <el-descriptions :column="1" border v-if="selectedParkingGate">
        <el-descriptions-item label="名称">
          {{ selectedParkingGate.name }}
        </el-descriptions-item>
        <el-descriptions-item label="位置">
          ({{ selectedParkingGate.x }}, {{ selectedParkingGate.y }})
        </el-descriptions-item>
        <el-descriptions-item label="所属停车场">
          {{ selectedParkingGate.parkingLotId || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="getParkingGateTagType(selectedParkingGate.state)" effect="dark" size="large">
            {{ getParkingGateStateName(selectedParkingGate.state) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      
      <el-divider>操作</el-divider>
      
      <div style="display: flex; justify-content: center; gap: 20px;">
        <el-button 
          type="success" 
          size="large"
          :disabled="selectedParkingGate?.state === 'OPEN' || selectedParkingGate?.state === 'OPENING'"
          @click="controlParkingGate('OPEN')"
          style="width: 120px;"
        >
          <el-icon><Unlock /></el-icon>
          开启闸机
        </el-button>
        
        <el-button 
          type="danger" 
          size="large"
          :disabled="selectedParkingGate?.state === 'CLOSED' || selectedParkingGate?.state === 'CLOSING'"
          @click="controlParkingGate('CLOSE')"
          style="width: 120px;"
        >
          <el-icon><Lock /></el-icon>
          关闭闸机
        </el-button>
      </div>
      
      <template #footer>
        <el-button @click="showParkingGateDialog = false">关闭</el-button>
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

    <!-- ✅ 道路详情弹窗 -->
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
              :percentage="selectedRoadDetail.congestionPercentage || 0" 
              :color="getCongestionColor(selectedRoadDetail.congestionPercentage || 0)"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Monitor, DataAnalysis, Setting, Back, User, ArrowDown, SwitchButton,
  Location, View, Hide, Refresh, RefreshLeft, Grid, Promotion, WarningFilled, Warning, Check, Van,
  Cpu, VideoPlay, VideoPause,  Sunny,  Lock,  Unlock
} from '@element-plus/icons-vue'
import CanvasMapContainer from '../components/map/CanvasMapContainer.vue'
import mapApi from '../api/map'
import roadApi from '../api/road'
import mapBg from '@/assets/bgi.png'
import trafficApi from '../api/traffic'  // ✅ 新增
import parkingApi from '../api/parking'

const router = useRouter()

// 当前选中的标签
const currentTab = ref('overview')

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
  total: 25600,
  percentage: 0,
  pageCount: 0
})

// 选中的块
const selectedBlock = ref(null)
const showBlockDialog = ref(false)

// 车辆数据
const vehicles = ref([])

// 选中的车辆
const selectedVehicle = ref(null)
const showVehicleDialog = ref(false)

// ✅ 高亮路径
const highlightedPath = ref([])

const trafficLights = ref([])
const showTrafficLightDialog = ref(false)
const selectedTrafficLight = ref(null)
const trafficLightForm = ref({
  state: 'RED',
  duration: 30
})
let trafficLightTimer = null

// ✅ 停车场闸机相关
const parkingGates = ref([])
const showParkingGateDialog = ref(false)
const selectedParkingGate = ref(null)
let parkingGateTimer = null

// ✅ 交通灯控制弹窗（选择列表）
const showTrafficLightControlDialog = ref(false)

// ✅ 实时监控相关
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

// ✅ 道路详情相关
const showRoadDetailDialog = ref(false)
const roadDetailLoading = ref(false)
const selectedRoadDetail = ref(null)

// ✅ 计算上次更新时间显示
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
      console.log(`📊 加载进度: ${count} / ~25000 (第 ${pageCount} 页)`)
    })
    
    console.log('✅ 收到地图数据:', data.length, '条')
    
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
 * API 诊断函数
 */
const diagnosisAPI = async () => {
  console.log('🔧 开始 API 诊断...')
  
  ElMessage.info('正在进行 API 诊断...')
  
  try {
    console.log('1️⃣ 测试健康检查 /health')
    const health = await mapApi.checkHealth()
    console.log('✅ 健康检查成功:', health)
    
    console.log('2️⃣ 测试获取第一页数据 /maps/data?limit=10')
    const firstPage = await mapApi.getMapData({ limit: 10 })
    console.log('✅ 第一页数据:', firstPage)
    
    console.log('3️⃣ 测试拥堵概览 /roads/congestion/overview')
    const congestion = await roadApi.getCongestionOverview()
    console.log('✅ 拥堵概览:', congestion)
    
    ElMessage.success({
      message: `API 诊断完成！健康状态: ${health.status}，道路数: ${congestion?.totalRoads || 0}`,
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
  if (!Array.isArray(data)) {
    console.error('❌ 地图数据格式错误')
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

/**
 * ✅ 获取道路拥堵概览
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
      
      // 根据拥堵数据更新地图块颜色
      updateMapBlocksFromCongestion(data.overview)
    }
  } catch (error) {
    console.error('❌ 获取拥堵概览失败:', error)
  }
}

/**
 * ✅ 根据拥堵数据更新地图块
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
 * ✅ 使用节点数据更新地图块
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
 * ✅ 切换实时监控
 */
const toggleRealtimeUpdate = () => {
  if (isRealtimeEnabled.value) {
    stopRealtimeUpdate()
  } else {
    startRealtimeUpdate()
  }
}

/**
 * ✅ 开始实时监控
 */
const startRealtimeUpdate = () => {
  if (congestionUpdateTimer) {
    ElMessage.warning('已在监控中')
    return
  }
  
  isRealtimeEnabled.value = true
  
  fetchCongestionOverview()
  
  congestionUpdateTimer = setInterval(() => {
    fetchCongestionOverview()
  }, 5000)
  
  ElMessage.success('开始实时监控道路状态（每5秒）')
}

/**
 * ✅ 停止实时监控
 */
const stopRealtimeUpdate = () => {
  if (congestionUpdateTimer) {
    clearInterval(congestionUpdateTimer)
    congestionUpdateTimer = null
    isRealtimeEnabled.value = false
    ElMessage.info('已停止实时监控')
  }
}

/**
 * ✅ 显示道路详情
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
 * ✅ 在地图上高亮道路
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
 * ✅ 获取交通等级标签类型
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
 * ✅ 获取交通等级名称
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
 * ✅ 获取拥堵率颜色
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

/**
 * 模拟车辆移动（测试用）
 */
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
 * 处理车辆点击
 */
const handleVehicleClick = (vehicleInfo) => {
  selectedVehicle.value = vehicleInfo
  showVehicleDialog.value = true
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
 * 获取速度标签类型
 */
const getSpeedTagType = (speed) => {
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

// /**
//  * 重置/清空地图
//  */
// const resetMap = () => {
//   initMap()
//   vehicles.value = []
//   highlightedPath.value = []
//   stopRealtimeUpdate()
//   roadCongestionList.value = []
//   ElMessage.success('地图已清空')
// }

/**
 * 应用地图设置
 */
const applySettings = () => {
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
  }, 3000)  // 每3秒刷新
  
  console.log('🚦 开始交通灯状态轮询（每3秒）')
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
 * 打开交通灯控制弹窗
 */
const openTrafficLightControl = () => {
  showTrafficLightControlDialog.value = true
}

/**
 * 处理交通灯点击（从地图）
 */
const handleTrafficLightClick = (light) => {
  selectedTrafficLight.value = light
  trafficLightForm.value = {
    state: light.state,
    duration: light.duration
  }
  showTrafficLightDialog.value = true
}

/**
 * 选择交通灯进行控制
 */
const selectTrafficLightForControl = (light) => {
  selectedTrafficLight.value = light
  trafficLightForm.value = {
    state: light.state,
    duration: light.duration
  }
  showTrafficLightControlDialog.value = false
  showTrafficLightDialog.value = true
}

/**
 * 更新交通灯状态
 */
const updateTrafficLightState = async () => {
  if (!selectedTrafficLight.value) return
  
  try {
    await trafficApi.updateState(selectedTrafficLight.value.id, {
      state: trafficLightForm.value.state,
      duration: trafficLightForm.value.duration
    })
    
    ElMessage.success(`交通灯 "${selectedTrafficLight.value.name}" 已更新为 ${getTrafficLightStateName(trafficLightForm.value.state)}`)
    
    // 更新本地数据
    const index = trafficLights.value.findIndex(l => l.id === selectedTrafficLight.value.id)
    if (index !== -1) {
      trafficLights.value[index] = {
        ...trafficLights.value[index],
        state: trafficLightForm.value.state,
        duration: trafficLightForm.value.duration
      }
    }
    
    showTrafficLightDialog.value = false
  } catch (error) {
    console.error('❌ 更新交通灯失败:', error)
    ElMessage.error('更新交通灯失败')
  }
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

/**
 * 获取交通灯状态标签类型
 */
const getTrafficLightTagType = (state) => {
  const types = {
    RED: 'danger',
    YELLOW: 'warning',
    GREEN: 'success'
  }
  return types[state] || 'info'
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
  }, 3000)
  
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
 * 处理停车场闸机点击
 */
const handleParkingGateClick = (gate) => {
  selectedParkingGate.value = gate
  showParkingGateDialog.value = true
}

/**
 * 控制停车场闸机
 */
const controlParkingGate = async (action) => {
  if (!selectedParkingGate.value) return
  
  try {
    await parkingApi.control(selectedParkingGate.value.id, action)
    
    ElMessage.success(`闸机 "${selectedParkingGate.value.name}" ${action === 'OPEN' ? '正在开启' : '正在关闭'}`)
    
    // 刷新数据
    await fetchParkingGates()
    
    // 更新选中的闸机
    const updated = parkingGates.value.find(g => g.id === selectedParkingGate.value.id)
    if (updated) {
      selectedParkingGate.value = updated
    }
  } catch (error) {
    console.error('❌ 控制闸机失败:', error)
    ElMessage.error('控制闸机失败')
  }
}

/**
 * 获取闸机状态名称
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
 * 获取闸机状态标签类型
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

// ============ 修改生命周期钩子 ============

onMounted(() => {
  ElMessage.success('欢迎使用管理者控制台')
  loadMapData()
  startRealtimeUpdate()
  startTrafficLightPolling()  // ✅ 新增
  startParkingGatePolling()   // ✅ 新增
})

onUnmounted(() => {
  stopRealtimeUpdate()
  stopTrafficLightPolling()   // ✅ 新增
  stopParkingGatePolling()    // ✅ 新增
})

// ============ 修改重置地图方法 ============

const resetMap = () => {
  initMap()
  vehicles.value = []
  highlightedPath.value = []
  trafficLights.value = []    // ✅ 新增
  parkingGates.value = []     // ✅ 新增
  stopRealtimeUpdate()
  stopTrafficLightPolling()   // ✅ 新增
  stopParkingGatePolling()    // ✅ 新增
  roadCongestionList.value = []
  ElMessage.success('地图已清空')
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
    road_closure: 0,
    building: 0,
    water: 0
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
  margin-bottom: 20px;
}

/* ✅ 拥堵列表卡片 */
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