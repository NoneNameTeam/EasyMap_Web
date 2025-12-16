<template>
  <div class="canvas-map-container" :style="containerStyle" ref="containerRef">
    <!-- Canvas 图层：背景图片 + 地图块 -->
    <canvas 
      ref="canvasRef" 
      class="map-canvas"
      :width="canvasWidth"
      :height="canvasHeight"
      @click="handleCanvasClick"
      @mousemove="handleCanvasMouseMove"
      @mouseleave="handleCanvasMouseLeave"
    ></canvas>

    <!-- Canvas 图层：车辆（独立层，方便动画） -->
    <canvas 
      ref="vehicleCanvasRef" 
      class="vehicle-canvas"
      :width="canvasWidth"
      :height="canvasHeight"
    ></canvas>

    <!-- Canvas 图层：交通灯和闸机（独立层） -->
    <canvas 
      ref="overlayCanvasRef" 
      class="overlay-canvas"
      :width="canvasWidth"
      :height="canvasHeight"
    ></canvas>

    <!-- DOM 层：悬停提示 -->
    <div v-if="hoveredBlock && !selectMode" class="info-tooltip" :style="tooltipStyle">
      <h4>{{ getBlockTypeName(hoveredBlock.type) }}</h4>
      <p>位置: ({{ hoveredBlock.x }}, {{ hoveredBlock.y }})</p>
      <p v-if="hoveredBlock.data?.name">{{ hoveredBlock.data.name }}</p>
    </div>

    <!-- 交通灯悬停提示 -->
    <div v-if="hoveredTrafficLight" class="info-tooltip traffic-light-tooltip" :style="tooltipStyle">
      <h4>🚦 {{ hoveredTrafficLight.name }}</h4>
      <p>状态: <span :style="{ color: getTrafficLightColor(hoveredTrafficLight.state) }">
        {{ getTrafficLightStateName(hoveredTrafficLight.state) }}
      </span></p>
      <p>剩余时间: <strong>{{ hoveredTrafficLight.remainingTime || 0 }}</strong> 秒</p>
      <p>持续时间: {{ hoveredTrafficLight.duration }}秒</p>
      <p>模式: {{ hoveredTrafficLight.mode === 'AUTO' ? '自动' : '手动' }}</p>
      <p>位置: ({{ hoveredTrafficLight.x }}, {{ hoveredTrafficLight.y }})</p>
    </div>

    <!-- 停车场闸机悬停提示 -->
    <div v-if="hoveredParkingGate" class="info-tooltip parking-gate-tooltip" :style="tooltipStyle">
      <h4>🚧 {{ hoveredParkingGate.name }}</h4>
      <p>状态: <span :style="{ color: getParkingGateColor(hoveredParkingGate.state) }">
        {{ getParkingGateStateName(hoveredParkingGate.state) }}
      </span></p>
      <p>位置: ({{ hoveredParkingGate.x }}, {{ hoveredParkingGate.y }})</p>
    </div>

    <!-- 选择模式提示 -->
    <div v-if="selectMode" class="select-mode-tip">
      <el-tag :type="selectMode === 'start' ? 'success' : 'danger'" size="large">
        {{ selectMode === 'start' ? ' 请点击地图选择起点' : ' 请点击地图选择终点' }}
      </el-tag>
    </div>

    <!-- 起点/终点标记 -->
    <div 
      v-if="startPoint" 
      class="point-marker start-marker"
      :style="{ left: startPoint.x * blockSize + blockSize/2 + 'px', top: startPoint.y * blockSize + blockSize/2 + 'px' }"
    >
      <el-icon :size="24" color="#409EFF">
        <Flag />
      </el-icon>
    </div>
    <div 
      v-if="endPoint" 
      class="point-marker end-marker"
      :style="{ left: endPoint.x * blockSize + blockSize/2 + 'px', top: endPoint.y * blockSize + blockSize/2 + 'px' }"
    >
      <el-icon :size="24" color="#F56C6C">
        <Position />
      </el-icon>
    </div>

    <!-- 调试信息 -->
    <div v-if="showDebug" class="debug-info">
      <p>渲染模式: Canvas</p>
      <p>地图块: {{ blocks.length }} 个</p>
      <p>车辆: {{ vehicles.length }} 辆</p>
      <p>交通灯: {{ trafficLights.length }} 个</p>
      <p>停车闸机: {{ parkingGates.length }} 个</p>
      <p>高亮路径: {{ highlightedPath.length }} 个点</p>
      <p>FPS: {{ fps }}</p>
      <p>鼠标: ({{ mousePos.x }}, {{ mousePos.y }})</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  width: { type: Number, default: 20 },
  height: { type: Number, default: 15 },
  blockSize: { type: Number, default: 50 },
  blocks: { type: Array, default: () => [] },
  vehicles: { type: Array, default: () => [] },
  showDebug: { type: Boolean, default: false },
  backgroundImage: { type: String, default: '' },
  highlightedPath: { type: Array, default: () => [] },
  selectMode: { type: String, default: null },
  startPoint: { type: Object, default: null },
  endPoint: { type: Object, default: null },
  // 交通灯数据
  trafficLights: { type: Array, default: () => [] },
  // 停车场闸机数据
  parkingGates: { type: Array, default: () => [] }
})

const emit = defineEmits([
  'block-click', 
  'block-hover', 
  'vehicle-click', 
  'point-select',
  'traffic-light-click',
  'parking-gate-click'
])

// Refs
const containerRef = ref(null)
const canvasRef = ref(null)
const vehicleCanvasRef = ref(null)
const overlayCanvasRef = ref(null)

// 状态
const hoveredBlock = ref(null)
const hoveredTrafficLight = ref(null)
const hoveredParkingGate = ref(null)
const mousePos = ref({ x: 0, y: 0 })
const fps = ref(0)

// Canvas 上下文
let ctx = null
let vehicleCtx = null
let overlayCtx = null

// 背景图片对象
let bgImage = null
let bgImageLoaded = false

// 性能监控
let frameCount = 0
let lastTime = Date.now()
let animationFrameId = null

// 计算属性
const canvasWidth = computed(() => props.width * props.blockSize)
const canvasHeight = computed(() => props.height * props.blockSize)

const containerStyle = computed(() => ({
  width: `${canvasWidth.value}px`,
  height: `${canvasHeight.value}px`,
  position: 'relative'
}))

const tooltipStyle = computed(() => ({
  left: `${mousePos.value.x + 10}px`,
  top: `${mousePos.value.y + 10}px`
}))

// 创建高亮路径的坐标集合
const highlightedPathSet = computed(() => {
  const set = new Set()
  props.highlightedPath.forEach(point => {
    set.add(`${point.x},${point.y}`)
  })
  return set
})

// 颜色配置
const blockColors = {
  empty: 'transparent',
  building: 'rgba(52, 73, 94, 0.8)',
  water: 'rgba(52, 152, 219, 0.4)',
  normal: 'rgba(149, 165, 166, 0.3)',
  smooth: 'rgba(39, 174, 96, 0.4)',
  congested: 'rgba(231, 76, 60, 0.5)',
  accident: 'rgba(230, 126, 34, 0.7)',
  construction: 'rgba(243, 156, 18, 0.6)',
  road_closure: 'rgba(192, 57, 43, 0.8)'
}

const blockBorders = {
  empty: 'transparent',
  building: '#2c3e50',
  water: 'rgba(52, 152, 219, 0.3)',
  normal: 'rgba(149, 165, 166, 0.2)',
  smooth: 'rgba(39, 174, 96, 0.3)',
  congested: 'rgba(231, 76, 60, 0.3)',
  accident: '#d35400',
  construction: '#e67e22',
  road_closure: '#a93226'
}

const highlightColor = 'rgba(39, 174, 96, 0.7)'
const highlightBorder = '#27ae60'

// 交通灯颜色配置
const trafficLightColors = {
  RED: '#e74c3c',
  YELLOW: '#f1c40f',
  GREEN: '#27ae60'
}

// 停车场闸机颜色配置
const parkingGateColors = {
  OPEN: '#27ae60',
  CLOSED: '#e74c3c',
  OPENING: '#f1c40f',
  CLOSING: '#f39c12'
}

/**
 * 获取交通灯颜色
 */
function getTrafficLightColor(state) {
  return trafficLightColors[state] || '#95a5a6'
}

/**
 * 获取交通灯状态名称
 */
function getTrafficLightStateName(state) {
  const names = {
    RED: '红灯',
    YELLOW: '黄灯',
    GREEN: '绿灯'
  }
  return names[state] || state
}

/**
 * 获取停车场闸机颜色
 */
function getParkingGateColor(state) {
  return parkingGateColors[state] || '#95a5a6'
}

/**
 * 获取停车场闸机状态名称
 */
function getParkingGateStateName(state) {
  const names = {
    OPEN: '已开启',
    CLOSED: '已关闭',
    OPENING: '正在开启',
    CLOSING: '正在关闭'
  }
  return names[state] || state
}

/**
 * 加载背景图片
 */
function loadBackgroundImage(url) {
  if (!url) {
    bgImageLoaded = false
    bgImage = null
    drawAllBlocks()
    return
  }
  
  console.log('🖼️ 加载背景图片:', url)
  
  bgImage = new Image()
  bgImage.onload = () => {
    console.log('✅ 背景图片加载成功')
    bgImageLoaded = true
    drawAllBlocks()
  }
  bgImage.onerror = () => {
    console.error('❌ 背景图片加载失败:', url)
    bgImageLoaded = false
    bgImage = null
    drawAllBlocks()
  }
  bgImage.src = url
}

/**
 * 绘制背景
 */
function drawBackground() {
  if (!ctx) return
  
  if (bgImageLoaded && bgImage) {
    ctx.drawImage(bgImage, 0, 0, canvasWidth.value, canvasHeight.value)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
  } else {
    ctx.fillStyle = '#f0f2f5'
    ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
  }
}

/**
 * 绘制网格（调试模式）
 */
function drawGrid() {
  if (!ctx || !props.showDebug) return
  
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
  ctx.lineWidth = 0.5
  
  for (let i = 0; i <= props.width; i++) {
    ctx.beginPath()
    ctx.moveTo(i * props.blockSize, 0)
    ctx.lineTo(i * props.blockSize, canvasHeight.value)
    ctx.stroke()
  }
  
  for (let j = 0; j <= props.height; j++) {
    ctx.beginPath()
    ctx.moveTo(0, j * props.blockSize)
    ctx.lineTo(canvasWidth.value, j * props.blockSize)
    ctx.stroke()
  }
}

/**
 * 绘制单个地图块
 */
function drawBlock(block, isHovered = false) {
  if (!ctx || block.type === 'empty') return
  
  const x = block.x * props.blockSize
  const y = block.y * props.blockSize
  const size = props.blockSize
  
  const isHighlighted = highlightedPathSet.value.has(`${block.x},${block.y}`)
  
  if (isHighlighted) {
    ctx.fillStyle = highlightColor
  } else {
    ctx.fillStyle = blockColors[block.type] || blockColors.normal
  }
  ctx.fillRect(x, y, size, size)
  
  if (isHighlighted) {
    ctx.strokeStyle = highlightBorder
    ctx.lineWidth = 2
  } else {
    ctx.strokeStyle = blockBorders[block.type] || blockBorders.normal
    ctx.lineWidth = isHovered ? 2 : 1
  }
  ctx.strokeRect(x, y, size, size)
  
  if (isHovered && !isHighlighted) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.fillRect(x, y, size, size)
  }
  
  if (props.showDebug) {
    ctx.fillStyle = '#fff'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = '#000'
    ctx.shadowBlur = 2
    ctx.fillText(`${block.x},${block.y}`, x + size / 2, y + size / 2)
    ctx.shadowBlur = 0
  }
}

/**
 * 绘制高亮路径连接线
 */
function drawPathLines() {
  if (!ctx || props.highlightedPath.length < 2) return
  
  ctx.strokeStyle = '#27ae60'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  ctx.beginPath()
  
  const firstPoint = props.highlightedPath[0]
  ctx.moveTo(
    firstPoint.x * props.blockSize + props.blockSize / 2,
    firstPoint.y * props.blockSize + props.blockSize / 2
  )
  
  for (let i = 1; i < props.highlightedPath.length; i++) {
    const point = props.highlightedPath[i]
    ctx.lineTo(
      point.x * props.blockSize + props.blockSize / 2,
      point.y * props.blockSize + props.blockSize / 2
    )
  }
  
  ctx.stroke()
}

/**
 * 绘制所有地图块
 */
function drawAllBlocks() {
  if (!ctx) return
  
  const startTime = performance.now()
  
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  drawBackground()
  drawGrid()
  
  props.blocks.forEach(block => {
    const isHovered = hoveredBlock.value && 
                     hoveredBlock.value.x === block.x && 
                     hoveredBlock.value.y === block.y
    drawBlock(block, isHovered)
  })
  
  drawPathLines()
  
  const endTime = performance.now()
  console.log(`🎨 重绘完成，耗时: ${(endTime - startTime).toFixed(2)}ms，块数: ${props.blocks.length}`)
}

/**
 * 绘制单个交通灯（带剩余时间显示）
 */
function drawTrafficLight(light, isHovered = false) {
  if (!overlayCtx) return
  
  const centerX = light.x * props.blockSize + props.blockSize / 2
  const centerY = light.y * props.blockSize + props.blockSize / 2
  
  // 交通灯尺寸配置
  const lightRadius = Math.max(4, props.blockSize / 6)
  const spacing = lightRadius * 2.5
  const boxWidth = lightRadius * 3
  const boxHeight = spacing * 3 + lightRadius
  
  // 绘制交通灯背景框
  overlayCtx.fillStyle = isHovered ? '#1a1a1a' : '#2c2c2c'
  overlayCtx.strokeStyle = isHovered ? '#fff' : '#555'
  overlayCtx.lineWidth = isHovered ? 3 : 2
  
  const boxX = centerX - boxWidth / 2
  const boxY = centerY - boxHeight / 2
  
  // 圆角矩形
  const radius = 4
  overlayCtx.beginPath()
  overlayCtx.moveTo(boxX + radius, boxY)
  overlayCtx.lineTo(boxX + boxWidth - radius, boxY)
  overlayCtx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius)
  overlayCtx.lineTo(boxX + boxWidth, boxY + boxHeight - radius)
  overlayCtx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight)
  overlayCtx.lineTo(boxX + radius, boxY + boxHeight)
  overlayCtx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius)
  overlayCtx.lineTo(boxX, boxY + radius)
  overlayCtx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY)
  overlayCtx.closePath()
  overlayCtx.fill()
  overlayCtx.stroke()
  
  // 绘制三个灯（红、黄、绿）
  const lights = [
    { color: 'RED', y: centerY - spacing },
    { color: 'YELLOW', y: centerY },
    { color: 'GREEN', y: centerY + spacing }
  ]
  
  lights.forEach(({ color, y }) => {
    const isActive = light.state === color
    
    overlayCtx.beginPath()
    overlayCtx.arc(centerX, y, lightRadius, 0, Math.PI * 2)
    
    if (isActive) {
      overlayCtx.fillStyle = trafficLightColors[color]
      overlayCtx.shadowColor = trafficLightColors[color]
      overlayCtx.shadowBlur = 15
    } else {
      overlayCtx.fillStyle = `${trafficLightColors[color]}40`
      overlayCtx.shadowBlur = 0
    }
    
    overlayCtx.fill()
    overlayCtx.shadowBlur = 0
    
    overlayCtx.strokeStyle = '#111'
    overlayCtx.lineWidth = 1
    overlayCtx.stroke()
  })
  
  // ✅ 显示剩余时间（始终显示）
  const remainingTime = light.remainingTime || 0
  if (remainingTime > 0 || props.showDebug) {
    // 剩余时间背景
    const timeText = `${remainingTime}s`
    overlayCtx.font = 'bold 12px Arial'
    const textWidth = overlayCtx.measureText(timeText).width
    
    const timeBgX = centerX - textWidth / 2 - 4
    const timeBgY = boxY + boxHeight + 3
    const timeBgWidth = textWidth + 8
    const timeBgHeight = 16
    
    // 根据当前灯色设置背景色
    overlayCtx.fillStyle = trafficLightColors[light.state] || '#666'
    overlayCtx.beginPath()
    overlayCtx.roundRect(timeBgX, timeBgY, timeBgWidth, timeBgHeight, 3)
    overlayCtx.fill()
    
    // 剩余时间文字
    overlayCtx.fillStyle = '#fff'
    overlayCtx.textAlign = 'center'
    overlayCtx.textBaseline = 'middle'
    overlayCtx.shadowColor = '#000'
    overlayCtx.shadowBlur = 2
    overlayCtx.fillText(timeText, centerX, timeBgY + timeBgHeight / 2)
    overlayCtx.shadowBlur = 0
  }
  
  // 显示名称（调试模式或悬停）
  if (props.showDebug || isHovered) {
    overlayCtx.fillStyle = '#fff'
    overlayCtx.font = 'bold 10px Arial'
    overlayCtx.textAlign = 'center'
    overlayCtx.shadowColor = '#000'
    overlayCtx.shadowBlur = 3
    overlayCtx.fillText(light.name || light.id, centerX, boxY - 8)
    overlayCtx.shadowBlur = 0
  }
}

/**
 * 绘制单个停车场闸机
 */
function drawParkingGate(gate, isHovered = false) {
  if (!overlayCtx) return
  
  const centerX = gate.x * props.blockSize + props.blockSize / 2
  const centerY = gate.y * props.blockSize + props.blockSize / 2
  
  const gateWidth = Math.max(20, props.blockSize * 0.8)
  const gateHeight = Math.max(8, props.blockSize * 0.3)
  const poleWidth = 6
  const poleHeight = gateHeight * 1.5
  
  const stateColor = parkingGateColors[gate.state] || '#95a5a6'
  let gateAngle = 0
  
  switch (gate.state) {
    case 'OPEN':
      gateAngle = -80
      break
    case 'CLOSED':
      gateAngle = 0
      break
    case 'OPENING':
      gateAngle = -40
      break
    case 'CLOSING':
      gateAngle = -40
      break
  }
  
  // 绘制底座
  overlayCtx.fillStyle = '#555'
  overlayCtx.fillRect(centerX - poleWidth / 2, centerY - poleHeight / 2, poleWidth, poleHeight)
  
  // 绘制杆（带旋转）
  overlayCtx.save()
  overlayCtx.translate(centerX, centerY - poleHeight / 2 + 4)
  overlayCtx.rotate((gateAngle * Math.PI) / 180)
  
  overlayCtx.fillStyle = stateColor
  overlayCtx.fillRect(0, -gateHeight / 2, gateWidth, gateHeight)
  
  overlayCtx.strokeStyle = isHovered ? '#fff' : '#333'
  overlayCtx.lineWidth = isHovered ? 2 : 1
  overlayCtx.strokeRect(0, -gateHeight / 2, gateWidth, gateHeight)
  
  overlayCtx.fillStyle = gate.state === 'CLOSED' ? '#fff' : '#333'
  for (let i = 0; i < gateWidth; i += 8) {
    overlayCtx.fillRect(i, -gateHeight / 2, 3, gateHeight)
  }
  
  overlayCtx.restore()
  
  // 显示状态标签
  const stateText = getParkingGateStateName(gate.state)
  overlayCtx.font = 'bold 10px Arial'
  const textWidth = overlayCtx.measureText(stateText).width
  
  overlayCtx.fillStyle = stateColor
  overlayCtx.beginPath()
  overlayCtx.roundRect(centerX - textWidth / 2 - 4, centerY + poleHeight / 2 + 3, textWidth + 8, 14, 3)
  overlayCtx.fill()
  
  overlayCtx.fillStyle = '#fff'
  overlayCtx.textAlign = 'center'
  overlayCtx.textBaseline = 'middle'
  overlayCtx.fillText(stateText, centerX, centerY + poleHeight / 2 + 10)
  
  // 显示名称
  if (props.showDebug || isHovered) {
    overlayCtx.fillStyle = '#fff'
    overlayCtx.font = 'bold 10px Arial'
    overlayCtx.textAlign = 'center'
    overlayCtx.shadowColor = '#000'
    overlayCtx.shadowBlur = 3
    overlayCtx.fillText(gate.name || gate.id, centerX, centerY - poleHeight / 2 - 10)
    overlayCtx.shadowBlur = 0
  }
}

/**
 * 绘制所有交通灯和闸机
 */
function drawOverlay() {
  if (!overlayCtx) return
  
  overlayCtx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  
  props.trafficLights.forEach(light => {
    const isHovered = hoveredTrafficLight.value && hoveredTrafficLight.value.id === light.id
    drawTrafficLight(light, isHovered)
  })
  
  props.parkingGates.forEach(gate => {
    const isHovered = hoveredParkingGate.value && hoveredParkingGate.value.id === gate.id
    drawParkingGate(gate, isHovered)
  })
}

/**
 * 绘制车辆
 */
function drawVehicles() {
  if (!vehicleCtx) return
  
  vehicleCtx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  
  props.vehicles.forEach(vehicle => {
    const x = vehicle.x * props.blockSize + (vehicle.offsetX || 0)
    const y = vehicle.y * props.blockSize + (vehicle.offsetY || 0)
    
    vehicleCtx.save()
    vehicleCtx.translate(x, y)
    vehicleCtx.rotate((vehicle.direction * Math.PI) / 180)
    
    vehicleCtx.fillStyle = '#3498db'
    vehicleCtx.beginPath()
    vehicleCtx.moveTo(0, -15)
    vehicleCtx.lineTo(-10, 10)
    vehicleCtx.lineTo(10, 10)
    vehicleCtx.closePath()
    vehicleCtx.fill()
    
    vehicleCtx.strokeStyle = '#2980b9'
    vehicleCtx.lineWidth = 2
    vehicleCtx.stroke()
    
    vehicleCtx.restore()
    
    if (props.showDebug) {
      vehicleCtx.fillStyle = '#2c3e50'
      vehicleCtx.font = 'bold 10px Arial'
      vehicleCtx.textAlign = 'center'
      vehicleCtx.fillText(vehicle.plateNumber || '', x, y + 25)
    }
  })
}

/**
 * 检测点击是否命中交通灯
 */
function hitTestTrafficLight(x, y) {
  const gridX = x / props.blockSize
  const gridY = y / props.blockSize
  
  for (const light of props.trafficLights) {
    const dx = Math.abs(gridX - light.x - 0.5)
    const dy = Math.abs(gridY - light.y - 0.5)
    if (dx < 0.8 && dy < 1.2) {
      return light
    }
  }
  return null
}

/**
 * 检测点击是否命中停车场闸机
 */
function hitTestParkingGate(x, y) {
  const gridX = x / props.blockSize
  const gridY = y / props.blockSize
  
  for (const gate of props.parkingGates) {
    const dx = Math.abs(gridX - gate.x - 0.5)
    const dy = Math.abs(gridY - gate.y - 0.5)
    if (dx < 1 && dy < 0.8) {
      return gate
    }
  }
  return null
}

/**
 * Canvas 点击事件
 */
function handleCanvasClick(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top
  const x = Math.floor(clickX / props.blockSize)
  const y = Math.floor(clickY / props.blockSize)
  
  if (props.selectMode) {
    emit('point-select', { x, y, type: props.selectMode })
    return
  }
  
  const clickedLight = hitTestTrafficLight(clickX, clickY)
  if (clickedLight) {
    emit('traffic-light-click', clickedLight)
    return
  }
  
  const clickedGate = hitTestParkingGate(clickX, clickY)
  if (clickedGate) {
    emit('parking-gate-click', clickedGate)
    return
  }
  
  const block = props.blocks.find(b => b.x === x && b.y === y)
  if (block) {
    emit('block-click', block)
  }
}

/**
 * Canvas 鼠标移动
 */
function handleCanvasMouseMove(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  const clientX = event.clientX - rect.left
  const clientY = event.clientY - rect.top
  const x = Math.floor(clientX / props.blockSize)
  const y = Math.floor(clientY / props.blockSize)
  
  mousePos.value = { x: clientX, y: clientY }
  
  const hitLight = hitTestTrafficLight(clientX, clientY)
  if (hitLight) {
    if (!hoveredTrafficLight.value || hoveredTrafficLight.value.id !== hitLight.id) {
      hoveredTrafficLight.value = hitLight
      hoveredBlock.value = null
      hoveredParkingGate.value = null
      drawOverlay()
    }
    return
  } else if (hoveredTrafficLight.value) {
    hoveredTrafficLight.value = null
    drawOverlay()
  }
  
  const hitGate = hitTestParkingGate(clientX, clientY)
  if (hitGate) {
    if (!hoveredParkingGate.value || hoveredParkingGate.value.id !== hitGate.id) {
      hoveredParkingGate.value = hitGate
      hoveredBlock.value = null
      hoveredTrafficLight.value = null
      drawOverlay()
    }
    return
  } else if (hoveredParkingGate.value) {
    hoveredParkingGate.value = null
    drawOverlay()
  }
  
  const block = props.blocks.find(b => b.x === x && b.y === y)
  
  if (block) {
    if (!hoveredBlock.value || hoveredBlock.value.x !== x || hoveredBlock.value.y !== y) {
      hoveredBlock.value = block
      emit('block-hover', { ...block, isEnter: true })
      drawAllBlocks()
    }
  } else {
    if (hoveredBlock.value) {
      emit('block-hover', { ...hoveredBlock.value, isEnter: false })
      hoveredBlock.value = null
      drawAllBlocks()
    }
  }
}

/**
 * 鼠标离开
 */
function handleCanvasMouseLeave() {
  if (hoveredBlock.value) {
    emit('block-hover', { ...hoveredBlock.value, isEnter: false })
    hoveredBlock.value = null
    drawAllBlocks()
  }
  
  if (hoveredTrafficLight.value) {
    hoveredTrafficLight.value = null
    drawOverlay()
  }
  
  if (hoveredParkingGate.value) {
    hoveredParkingGate.value = null
    drawOverlay()
  }
}

/**
 * 获取块类型名称
 */
function getBlockTypeName(type) {
  const names = {
    empty: '空白',
    building: '建筑物',
    water: '水域',
    normal: '普通道路',
    smooth: '畅通',
    congested: '拥堵',
    accident: '事故',
    construction: '施工中',
    road_closure: '道路封闭'
  }
  return names[type] || type
}

/**
 * 动画循环
 */
function animate() {
  drawVehicles()
  drawOverlay()
  
  frameCount++
  const now = Date.now()
  if (now - lastTime >= 1000) {
    fps.value = frameCount
    frameCount = 0
    lastTime = now
  }
  
  animationFrameId = requestAnimationFrame(animate)
}

/**
 * 初始化
 */
onMounted(() => {
  ctx = canvasRef.value?.getContext('2d')
  vehicleCtx = vehicleCanvasRef.value?.getContext('2d')
  overlayCtx = overlayCanvasRef.value?.getContext('2d')
  
  if (ctx && vehicleCtx && overlayCtx) {
    ctx.imageSmoothingEnabled = true
    vehicleCtx.imageSmoothingEnabled = true
    overlayCtx.imageSmoothingEnabled = true
    
    if (props.backgroundImage) {
      loadBackgroundImage(props.backgroundImage)
    } else {
      drawAllBlocks()
    }
    
    animate()
  }
})

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})

// 监听数据变化
watch(() => props.blocks, () => {
  drawAllBlocks()
}, { deep: true })

watch(() => props.vehicles, () => {
  drawVehicles()
}, { deep: true })

watch(() => props.showDebug, () => {
  drawAllBlocks()
  drawOverlay()
})

watch(() => props.backgroundImage, (newUrl) => {
  loadBackgroundImage(newUrl)
})

watch(() => props.highlightedPath, () => {
  drawAllBlocks()
}, { deep: true })

watch(() => props.trafficLights, () => {
  drawOverlay()
}, { deep: true })

watch(() => props.parkingGates, () => {
  drawOverlay()
}, { deep: true })
</script>

<style scoped>
.canvas-map-container {
  position: relative;
  margin: 0 auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  background: #f0f2f5;
}

.map-canvas,
.vehicle-canvas,
.overlay-canvas {
  position: absolute;
  top: 0;
  left: 0;
  cursor: crosshair;
}

.map-canvas {
  z-index: 1;
}

.vehicle-canvas {
  z-index: 2;
  pointer-events: none;
}

.overlay-canvas {
  z-index: 3;
  pointer-events: none;
}

.info-tooltip {
  position: absolute;
  z-index: 100;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 10px 15px;
  border-radius: 6px;
  pointer-events: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  min-width: 150px;
}

.info-tooltip h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #67B3DB;
}

.info-tooltip p {
  margin: 4px 0;
  font-size: 12px;
}

.traffic-light-tooltip h4 {
  color: #f1c40f;
}

.parking-gate-tooltip h4 {
  color: #e67e22;
}

.select-mode-tip {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.point-marker {
  position: absolute;
  z-index: 50;
  font-size: 24px;
  transform: translate(-50%, -100%);
  pointer-events: none;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  animation: bounce 0.5s ease-out;
}

@keyframes bounce {
  0% { transform: translate(-50%, -150%); }
  50% { transform: translate(-50%, -90%); }
  100% { transform: translate(-50%, -100%); }
}

.debug-info {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  z-index: 200;
  font-family: 'Courier New', monospace;
  min-width: 180px;
}

.debug-info p {
  margin: 4px 0;
  line-height: 1.5;
}
</style>