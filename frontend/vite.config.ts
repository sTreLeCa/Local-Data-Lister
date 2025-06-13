// frontend/vite.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { // Keep your existing proxy configuration
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Your backend port
        changeOrigin: true,
      }
    }
  },
  test: { // Add this test configuration block for Vitest
    globals: true, // Allows you to use describe, it, expect, etc. without importing them
    environment: 'jsdom', // Use jsdom to simulate browser environment
    setupFiles: './src/setupTests.ts', // Path to your setup file (we'll create this next)
    css: true, // If you want to process CSS imports in tests (e.g., CSS Modules)
  },
})