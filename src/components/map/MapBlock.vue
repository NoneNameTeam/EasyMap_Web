<template>
  <div 
    class="map-block" 
    :class="blockClass"
    :style="blockStyle"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 可选：显示调试信息 -->
    <div v-if="showDebug" class="debug-info">
      {{ x }},{{ y }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

// 定义 props
const props = defineProps({
  // 块类型：building(建筑), normal(正常), congested(拥堵), smooth(畅通), accident(事故), construction(施工)
  type: {
    type: String,
    default: 'normal',
    validator: (value) => {
      return ['building', 'normal', 'congested', 'smooth', 'accident', 'construction', 'empty'].includes(value)
    }
  },
  // X 坐标位置
  x: {
    type: Number,
    default: 0
  },
  // Y 坐标位置
  y: {
    type: Number,
    default: 0
  },
  // 块的大小（像素）
  size: {
    type: Number,
    default: 50
  },
  // 是否显示调试信息
  showDebug: {
    type: Boolean,
    default: false
  },
  // 自定义数据（可以存储额外信息）
  data: {
    type: Object,
    default: () => ({})
  }
})

// 定义 emits
const emit = defineEmits(['click', 'hover'])

// 鼠标悬停状态
const isHovered = ref(false)

// 类型配置映射
const typeConfig = {
  // 空白区域
  empty: {
    backgroundColor: 'transparent',
    opacity: 0,
    border: 'none'
  },
  // 建筑物
  building: {
    backgroundColor: '#34495e',
    opacity: 0.8,
    border: '1px solid #2c3e50'
  },
  // 正常道路
  normal: {
    backgroundColor: '#95a5a6',
    opacity: 0.3,
    border: '1px solid rgba(149, 165, 166, 0.2)'
  },
  // 畅通
  smooth: {
    backgroundColor: '#27ae60',
    opacity: 0.4,
    border: '1px solid rgba(39, 174, 96, 0.3)'
  },
  // 拥堵
  congested: {
    backgroundColor: '#e74c3c',
    opacity: 0.5,
    border: '1px solid rgba(231, 76, 60, 0.3)'
  },
  // 事故
  accident: {
    backgroundColor: '#e67e22',
    opacity: 0.7,
    border: '2px solid #d35400',
    animation: 'blink 1s infinite'
  },
  // 施工
  construction: {
    backgroundColor: '#f39c12',
    opacity: 0.6,
    border: '2px dashed #e67e22'
  }
}

// 计算块的类名
const blockClass = computed(() => {
  return [
    `block-${props.type}`,
    { 'block-hovered': isHovered.value }
  ]
})

// 计算块的样式
const blockStyle = computed(() => {
  const config = typeConfig[props.type] || typeConfig.normal
  
  return {
    position: 'absolute',
    left: `${props.x * props.size}px`,
    top: `${props.y * props.size}px`,
    width: `${props.size}px`,
    height: `${props.size}px`,
    backgroundColor: config.backgroundColor,
    opacity: isHovered.value ? Math.min(config.opacity + 0.2, 1) : config.opacity,
    border: config.border,
    animation: config.animation || 'none',
    transition: 'all 0.3s ease',
    cursor: props.type !== 'empty' ? 'pointer' : 'default',
    boxSizing: 'border-box'
  }
})

// 点击事件
const handleClick = () => {
  if (props.type !== 'empty') {
    emit('click', {
      type: props.type,
      x: props.x,
      y: props.y,
      data: props.data
    })
  }
}

// 鼠标进入
const handleMouseEnter = () => {
  isHovered.value = true
  if (props.type !== 'empty') {
    emit('hover', {
      type: props.type,
      x: props.x,
      y: props.y,
      data: props.data,
      isEnter: true
    })
  }
}

// 鼠标离开
const handleMouseLeave = () => {
  isHovered.value = false
  if (props.type !== 'empty') {
    emit('hover', {
      type: props.type,
      x: props.x,
      y: props.y,
      data: props.data,
      isEnter: false
    })
  }
}
</script>

<style scoped>
.map-block {
  position: absolute;
  box-sizing: border-box;
}

.debug-info {
  font-size: 10px;
  color: #fff;
  text-align: center;
  line-height: 50px;
  pointer-events: none;
  text-shadow: 0 0 2px #000;
}

/* 闪烁动画 - 用于事故区域 */
@keyframes blink {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 0.3;
  }
}

/* 悬停效果 */
.block-hovered {
  z-index: 10;
  transform: scale(1.05);
}

/* 不同类型的特殊样式 */
.block-building {
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
}

.block-accident {
  box-shadow: 0 0 10px rgba(231, 76, 60, 0.6);
}

.block-construction {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(0, 0, 0, 0.1) 10px,
    rgba(0, 0, 0, 0.1) 20px
  );
}
</style>