import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' 让 build 产物既能部署到服务器，也能直接用 file:// 打开（方便拷给孩子）
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5199,
    host: true,
    open: true,
  },
})
