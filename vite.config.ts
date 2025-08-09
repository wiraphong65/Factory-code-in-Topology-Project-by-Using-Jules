import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: ['ae0dd4302a57.ngrok-free.app'],
    hmr: {
      overlay: false, // ปิด error overlay ที่อาจทำให้ reload
    },
    watch: {
      usePolling: false, // ปิด polling ที่อาจทำให้ reload บ่อย
    },
  },
})
