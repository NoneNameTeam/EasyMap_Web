<template>
  <div class="home-container">
    <div class="header">
      <h1>智能综合交通与运载物联网管理系统</h1>
      <p class="subtitle">Intelligent Integrated Transportation & Cargo IoT Management System</p>
    </div>

    <div class="role-selection">
      <div class="role-card" @click="goToAdmin">
        <!-- <div class="icon">🔧</div> -->
        <h2>管理者入口</h2>
        <p>Administrator</p>
      </div>

      <div class="role-card" @click="goToUser">
        <!-- <div class="icon">👤</div> -->
        <h2>用户入口</h2>
        <p>User</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

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
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-weight: 600;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

.role-selection {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
  justify-content: center;
}

.role-card {
  background: white;
  border-radius: 20px;
  padding: 50px 60px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  min-width: 250px;
}

.role-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.role-card h2 {
  color: #333;
  font-size: 1.8rem;
  margin-bottom: 10px;
}

.role-card p {
  color: #666;
  font-size: 1rem;
}
</style>
