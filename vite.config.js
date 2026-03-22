import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'
import fixHtmlPlugin from './vite.plugins.js'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    fixHtmlPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },
  optimizeDeps: {
    include: ['element-plus', 'sql.js', 'xlsx', 'dayjs'],
  },
  assetsInclude: ['**/*.wasm'],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // 产线级包体积优化
    chunkSizeWarningLimit: 1000,
    // 关键：使用相对路径，确保 Electron 能正确加载
    base: '',
    rollupOptions: {
      output: {
        // 智能代码分割策略
        manualChunks: {
          // 第三方库分包
          'vendor-vue': ['vue', 'pinia'],
          'vendor-ui': ['element-plus', '@element-plus/icons-vue'],
          'vendor-chart': ['echarts'],
          'vendor-xlsx': ['xlsx'],
          'vendor-pdf': ['html2canvas', 'jspdf'],
          'vendor-time': ['dayjs'],
          'vendor-db': ['sql.js'],
        },
        // 资源文件命名规则 - 使用相对路径格式
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return 'images/[name]-[hash][extname]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return 'fonts/[name]-[hash][extname]'
          }
          if (ext === 'css') {
            return 'css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
    // 压缩优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        comments: false,
      },
    },
    // 源码映射（生产环境关闭）
    sourcemap: false,
    // CSS 优化
    cssCodeSplit: true,
    cssMinify: true,
  },
  server: {
    port: 5173,
  },
})
