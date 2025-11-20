<template>
  <div class="map-container" :style="containerStyle">
    <!-- 背景图片层 -->
    <div class="map-background" :style="backgroundStyle">
      <img v-if="backgroundImage" :src="backgroundImage" alt="地图背景" />
      <div v-else class="placeholder-bg">
        <p>背景图片位置</p>
      </div>
    </div>

    <!-- 地图块层 -->
    <div class="map-blocks-layer">
      <MapBlock
        v-for="(block, index) in blocks"
        :key="index"
        :type="block.type"
        :x="block.x"
        :y="block.y"
        :size="blockSize"
        :show-debug="showDebug"
        :data="block.data"
        @click="handleBlockClick"
        @hover="handleBlockHover"
      />
    </div>

    <!-- 信息提示层 -->
    <div v-if="hoveredBlock" class="info-tooltip" :style="tooltipStyle">
      <h4>{{ getBlockTypeName(hoveredBlock.type) }}</h4>
      <p>位置: ({{ hoveredBlock.x }}, {{ hoveredBlock.y }})</p>
      <p v-if="hoveredBlock.data.name">{{ hoveredBlock.data.name }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import MapBlock from './MapBlock.vue'

// 定义 props
const props = defineProps({
  // 地图宽度（块数量）
  width: {
    type: Number,
    default: 20
  },
  // 地图高度（块数量）
  height: {
    type: Number,
    default: 15
  },
  // 每个块的大小（像素）
  blockSize: {
    type: Number,
    default: 50
  },
  // 背景图片
  backgroundImage: {
    type: String,
    default: ''
  },
  // 地图块数据
  blocks: {
    type: Array,
    default: () => []
  },
  // 是否显示调试信息
  showDebug: {
    type: Boolean,
    default: false
  }
})

// 定义 emits
const emit = defineEmits(['block-click', 'block-hover'])

// 悬停的块
const hoveredBlock = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })

// 容器样式
const containerStyle = computed(() => ({
  width: `${props.width * props.blockSize}px`,
  height: `${props.height * props.blockSize}px`,
  position: 'relative'
}))

// 背景样式
const backgroundStyle = computed(() => ({
  width: '100%',
  height: '100%'
}))

// 提示框样式
const tooltipStyle = computed(() => ({
  left: `${tooltipPosition.value.x + 10}px`,
  top: `${tooltipPosition.value.y + 10}px`
}))

// 块点击事件
const handleBlockClick = (blockInfo) => {
  console.log('块被点击:', blockInfo)
  emit('block-click', blockInfo)
}

// 块悬停事件
const handleBlockHover = (blockInfo) => {
  if (blockInfo.isEnter) {
    hoveredBlock.value = blockInfo
    tooltipPosition.value = {
      x: blockInfo.x * props.blockSize,
      y: blockInfo.y * props.blockSize
    }
  } else {
    hoveredBlock.value = null
  }
  emit('block-hover', blockInfo)
}

// 获取块类型中文名称
const getBlockTypeName = (type) => {
  const names = {
    empty: '空白',
    building: '建筑物',
    normal: '普通道路',
    smooth: '畅通',
    congested: '拥堵',
    accident: '事故',
    // construction: '施工中'
  }
  return names[type] || type
}
</script>

<style scoped>
.map-container {
  position: relative;
  margin: 0 auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
}

.map-background {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.map-background img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-bg {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #67B3DB 0%, #9EDAF1 33%, #CDEEF8 66%, #FFFBDD 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-bg p {
  color: white;
  font-size: 1.5rem;
  opacity: 0.6;
}

.map-blocks-layer {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
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
  color: #3498db;
}

.info-tooltip p {
  margin: 4px 0;
  font-size: 12px;
}
</style>