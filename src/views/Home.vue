<template>
  <div class="home-container">
    <div class="header">
      <h1>智能综合交通与运载物联网管理系统</h1>
      <p class="subtitle">Intelligent Integrated Transportation & Cargo IoT Management System</p>
    </div>

    <div class="role-selection">
      <el-card class="role-card" shadow="hover" @click="goToAdmin">
        <div class="card-content">
          <el-icon :size="80" color="#67B3DB">
            <Setting />
          </el-icon>
          <h2>管理者入口</h2>
          <p>Administrator</p>
          <el-button type="primary" class="enter-btn">
            进入系统
            <el-icon class="ml-1"><ArrowRight /></el-icon>
          </el-button>
        </div>
      </el-card>

      <el-card class="role-card" shadow="hover" @click="goToUser">
        <div class="card-content">
          <el-icon :size="80" color="#67B3DB">
            <User />
          </el-icon>
          <h2>用户入口</h2>
          <p>User</p>
          <el-button type="primary" class="enter-btn">
            进入系统
            <el-icon class="ml-1"><ArrowRight /></el-icon>
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Setting, User, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()

const goToAdmin = () => {
  router.push('/admin')
}

const goToUser = () => {
  router.push('/user')
}
</script>

<style scoped>
.home-container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #67B3DB 0%, #9EDAF1 33%, #CDEEF8 66%, #FFFBDD 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 60px;
  animation: fadeInDown 0.8s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header h1 {
  font-size: 2.8rem;
  margin-bottom: 15px;
  font-weight: 600;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.95;
  font-weight: 300;
}

.role-selection {
  display: flex;
  gap: 50px;
  flex-wrap: wrap;
  justify-content: center;
}

.role-card {
  width: 320px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.role-card:hover {
  transform: translateY(-15px);
}

.card-content {
  text-align: center;
  padding: 30px 20px;
}

.card-content h2 {
  color: #2c3e50;
  font-size: 1.8rem;
  margin: 20px 0 10px;
}

.card-content p {
  color: #666;
  font-size: 1rem;
  margin-bottom: 25px;
}

.enter-btn {
  width: 100%;
  margin-top: 10px;
}

.ml-1 {
  margin-left: 4px;
}
</style>