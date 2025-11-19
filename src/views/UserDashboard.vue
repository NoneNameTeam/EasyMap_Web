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
        <el-menu-item index="orders">
          <el-icon><List /></el-icon>
          <span>我的订单</span>
        </el-menu-item>
        <el-menu-item index="query">
          <el-icon><Search /></el-icon>
          <span>实时查询</span>
        </el-menu-item>
        <el-menu-item index="route">
          <el-icon><MapLocation /></el-icon>
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
      <el-main class="content-area">
        <!-- 我的订单 -->
        <div v-if="currentTab === 'orders'">
          <el-card shadow="never">
            <template #header>
              <span><el-icon><List /></el-icon> 我的订单</span>
            </template>
            <el-empty description="暂无订单数据" />
          </el-card>
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
              <span><el-icon><MapLocation /></el-icon> 路线规划</span>
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User, List, Search, MapLocation, Back, ArrowDown, SwitchButton
} from '@element-plus/icons-vue'

const router = useRouter()
const currentTab = ref('orders')

const switchTab = (tab) => {
  currentTab.value = tab
}

const goBack = () => {
  ElMessage.success('已退出登录')
  router.push('/')
}
</script>

<style scoped>
.user-dashboard {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: #f0f2f5;
}

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

.main-container {
  flex: 1;
}

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
}

.user-info:hover {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ml-1 {
  margin-left: 5px;
}

.content-area {
  background: #f0f2f5;
  padding: 20px;
}
</style>