import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    open: true,
    // 配置代理解决跨域问题
    proxy: {
      '/api': {
        target: 'https://easymap-dev.qwqme.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log(' 代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(' 发送请求:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(' 收到响应:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})