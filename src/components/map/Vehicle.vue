<template>
  <div 
    class="vehicle" 
    :class="[`vehicle-${type}`, { 'vehicle-moving': isMoving }]"
    :style="vehicleStyle"
    @click="handleClick"
    @mouseenter="showInfo = true"
    @mouseleave="showInfo = false"
  >
    <!-- 车辆图标 -->
    <div class="vehicle-icon" :style="{ transform: `rotate(${direction}deg)` }">
      {{ vehicleIcon }}
    </div>

    <!-- 车辆信息提示 -->
    <div v-if="showInfo" class="vehicle-tooltip">
      <p class="vehicle-plate">{{ plateNumber }}</p>
      <p class="vehicle-speed">{{ speed }} km/h</p>
    </div>

    <!-- 运动轨迹点（可选） -->
    <div v-if="showTrail" class="vehicle-trail"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// 定义 props
const props = defineProps({
  // 车辆ID
  id: {
    type: [String, Number],
    required: true
  },
  // 车牌号
  plateNumber: {
    type: String,
    default: '未知车辆'
  },
  // X 坐标（地图块坐标）
  x: {
    type: Number,
    required: true
  },
  // Y 坐标（地图块坐标）
  y: {
    type: Number,
    required: true
  },
  // 精确的像素偏移（可选，用于更精确的定位）
  offsetX: {
    type: Number,
    default: 0
  },
  offsetY: {
    type: Number,
    default: 0
  },
  // 块大小
  blockSize: {
    type: Number,
    default: 50
  },
  // 车辆类型：car(小汽车), truck(卡车), bus(公交车)
  type: {
    type: String,
    default: 'car',
    validator: (value) => ['car', 'truck', 'bus'].includes(value)
  },
  // 速度 (km/h)
  speed: {
    type: Number,
    default: 0
  },
  // 方向角度 (0-360度, 0为向上/北)
  direction: {
    type: Number,
    default: 0
  },
  // 是否显示轨迹
  showTrail: {
    type: Boolean,
    default: false
  },
  // 移动过渡时间（毫秒）
  transitionDuration: {
    type: Number,
    default: 1000
  }
})

// 定义 emits
const emit = defineEmits(['click', 'position-update'])

// 响应式数据
const showInfo = ref(false)
const isMoving = ref(false)

// 车辆图标映射
const vehicleIcon = computed(() => {
  const icons = {
    car: '🚗',
    truck: '🚚',
    bus: '🚌'
  }
  return icons[props.type] || '🚗'
})

// 计算车辆样式
const vehicleStyle = computed(() => {
  // 计算实际像素位置
  const pixelX = props.x * props.blockSize + props.offsetX
  const pixelY = props.y * props.blockSize + props.offsetY
  
  return {
    left: `${pixelX}px`,
    top: `${pixelY}px`,
    transition: `all ${props.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
  }
})

// 监听位置变化
watch(
  () => [props.x, props.y, props.offsetX, props.offsetY],
  (newVal, oldVal) => {
    if (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1] || 
        newVal[2] !== oldVal[2] || newVal[3] !== oldVal[3]) {
      isMoving.value = true
      
      // 移动结束后重置状态
      setTimeout(() => {
        isMoving.value = false
        emit('position-update', {
          id: props.id,
          x: props.x,
          y: props.y
        })
      }, props.transitionDuration)
    }
  }
)

// 点击事件
const handleClick = () => {
  emit('click', {
    id: props.id,
    plateNumber: props.plateNumber,
    x: props.x,
    y: props.y,
    speed: props.speed,
    direction: props.direction,
    type: props.type
  })
}
</script>

<style scoped>
.vehicle {
  position: absolute;
  width: 40px;
  height: 40px;
  cursor: pointer;
  z-index: 100;
  transform: translate(-50%, -50%); /* 居中对齐 */
}

.vehicle-icon {
  font-size: 32px;
  transition: transform 0.3s ease;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  display: flex;
  align-items: center;
  justify-content: center;
}

.vehicle-moving .vehicle-icon {
  animation: vehicleMove 0.5s ease-in-out;
}

/* 车辆移动动画 */
@keyframes vehicleMove {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 车辆信息提示 */
.vehicle-tooltip {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 200;
}

.vehicle-tooltip::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(0, 0, 0, 0.85);
}

.vehicle-plate {
  margin: 0 0 4px 0;
  font-weight: 600;
  font-size: 13px;
  color: #67B3DB;
}

.vehicle-speed {
  margin: 0;
  font-size: 12px;
  color: #9EDAF1;
}

/* 轨迹点 */
.vehicle-trail {
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(103, 179, 219, 0.5);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: trailFade 2s ease-out forwards;
}

@keyframes trailFade {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(2);
  }
}

/* 不同类型车辆的样式 */
.vehicle-car:hover .vehicle-icon,
.vehicle-truck:hover .vehicle-icon,
.vehicle-bus:hover .vehicle-icon {
  transform: scale(1.2);
}
</style>