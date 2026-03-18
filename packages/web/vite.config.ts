import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-oxc';  // 改用 oxc 插件
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
});