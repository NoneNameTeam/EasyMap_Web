import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import UserDashboard from '../views/UserDashboard.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminDashboard
  },
  {
    path: '/user',
    name: 'User',
    component: UserDashboard
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router