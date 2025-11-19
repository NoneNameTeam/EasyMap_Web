<template>
  <div class="user-dashboard">
    <div class="sidebar">
      <div class="logo">
        <h2>用户中心</h2>
      </div>
      <nav class="nav-menu">
        <div class="nav-item">我的地图</div>
        <div class="nav-item">实时查询</div>
        <div class="nav-item">路线规划</div>
      </nav>
      <button class="back-btn" @click="goBack">返回首页</button>
    </div>

    <div class="main-content">
      <header class="top-bar">
        <h1>用户仪表盘</h1>
        <div class="user-info">用户</div>
      </header>

      <div class="content-area">
        <!-- 这里放置具体的用户内容 -->
        <h2>欢迎使用用户中心</h2>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.user-dashboard {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
}

.sidebar {
  width: 250px;
  background: #16a085;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.logo h2 {
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #1abc9c;
}

.nav-menu {
  flex: 1;
}

.nav-item {
  padding: 15px 20px;
  margin-bottom: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.nav-item:hover {
  background: #1abc9c;
}

.back-btn {
  padding: 12px;
  background: #3498db;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 1rem;
}

.back-btn:hover {
  background: #2980b9;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.top-bar {
  background: white;
  padding: 20px 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-area {
  padding: 30px;
}
</style>