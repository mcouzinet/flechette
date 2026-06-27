import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    // the emulator integration test only runs under `firebase emulators:exec`
    exclude: ['**/node_modules/**', '**/dist/**', '**/emulator-test/**', '**/*.emulator.test.*'],
  },
})
