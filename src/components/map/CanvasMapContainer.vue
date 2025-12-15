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

    <!-- DOM 层：悬停提示 -->
    <div v-if="hoveredBlock && !selectMode" class="info-tooltip" :style="tooltipStyle">
      <h4>{{ getBlockTypeName(hoveredBlock.type) }}</h4>
      <p>位置: ({{ hoveredBlock.x }}, {{ hoveredBlock.y }})</p>
      <p v-if="hoveredBlock.data?.name">{{ hoveredBlock.data.name }}</p>
    </div>

    <!-- 选择模式提示 -->
    <div v-if="selectMode" class="select-mode-tip">
      <el-tag :type="selectMode === 'start' ? 'success' : 'danger'" size="large">
        {{ selectMode === 'start' ? '🚩 请点击地图选择起点' : '🏁 请点击地图选择终点' }}
      </el-tag>
    </div>

    <!-- 起点/终点标记 -->
    <div 
      v-if="startPoint" 
      class="point-marker start-marker"
      :style="{ left: startPoint.x * blockSize + blockSize/2 + 'px', top: startPoint.y * blockSize + blockSize/2 + 'px' }"
    >
      🚩
    </div>
    <div 
      v-if="endPoint" 
      class="point-marker end-marker"
      :style="{ left: endPoint.x * blockSize + blockSize/2 + 'px', top: endPoint.y * blockSize + blockSize/2 + 'px' }"
    >
      🏁
    </div>

    <!-- 调试信息 -->
    <div v-if="showDebug" class="debug-info">
      <p>渲染模式: Canvas</p>
      <p>地图块: {{ blocks.length }} 个</p>
      <p>车辆: {{ vehicles.length }} 辆</p>
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
  // ✅ 新增：高亮路径
  highlightedPath: { type: Array, default: () => [] },
  // ✅ 新增：选择模式 ('start' | 'end' | null)
  selectMode: { type: String, default: null },
  // ✅ 新增：起点
  startPoint: { type: Object, default: null },
  // ✅ 新增：终点
  endPoint: { type: Object, default: null }
})

const emit = defineEmits(['block-click', 'block-hover', 'vehicle-click', 'point-select'])

// Refs
const containerRef = ref(null)
const canvasRef = ref(null)
const vehicleCanvasRef = ref(null)

// 状态
const hoveredBlock = ref(null)
const mousePos = ref({ x: 0, y: 0 })
const fps = ref(0)

// Canvas 上下文
let ctx = null
let vehicleCtx = null

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

// ✅ 创建高亮路径的坐标集合（用于快速查找）
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

// ✅ 高亮路径颜色（畅通绿色）
const highlightColor = 'rgba(39, 174, 96, 0.7)'
const highlightBorder = '#27ae60'

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
  
  // ✅ 检查是否在高亮路径中
  const isHighlighted = highlightedPathSet.value.has(`${block.x},${block.y}`)
  
  // 填充颜色
  if (isHighlighted) {
    ctx.fillStyle = highlightColor
  } else {
    ctx.fillStyle = blockColors[block.type] || blockColors.normal
  }
  ctx.fillRect(x, y, size, size)
  
  // 边框
  if (isHighlighted) {
    ctx.strokeStyle = highlightBorder
    ctx.lineWidth = 2
  } else {
    ctx.strokeStyle = blockBorders[block.type] || blockBorders.normal
    ctx.lineWidth = isHovered ? 2 : 1
  }
  ctx.strokeRect(x, y, size, size)
  
  // 悬停高亮
  if (isHovered && !isHighlighted) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.fillRect(x, y, size, size)
  }
  
  // 调试模式：显示坐标
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
 * ✅ 绘制高亮路径连接线
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
  
  // ✅ 绘制路径连接线
  drawPathLines()
  
  const endTime = performance.now()
  console.log(`🎨 重绘完成，耗时: ${(endTime - startTime).toFixed(2)}ms，块数: ${props.blocks.length}`)
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
 * Canvas 点击事件
 */
function handleCanvasClick(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  const x = Math.floor((event.clientX - rect.left) / props.blockSize)
  const y = Math.floor((event.clientY - rect.top) / props.blockSize)
  
  // ✅ 如果处于选择模式，发出选择事件
  if (props.selectMode) {
    emit('point-select', { x, y, type: props.selectMode })
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
  
  if (ctx && vehicleCtx) {
    ctx.imageSmoothingEnabled = true
    vehicleCtx.imageSmoothingEnabled = true
    
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
})

watch(() => props.backgroundImage, (newUrl) => {
  loadBackgroundImage(newUrl)
})

// ✅ 监听高亮路径变化
watch(() => props.highlightedPath, () => {
  drawAllBlocks()
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
.vehicle-canvas {
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

/* ✅ 选择模式提示 */
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

/* ✅ 起点/终点标记 */
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