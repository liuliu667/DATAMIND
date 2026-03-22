// vite.config.js
import { defineConfig } from "file:///D:/APP0/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/APP0/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import AutoImport from "file:///D:/APP0/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///D:/APP0/node_modules/unplugin-vue-components/dist/vite.js";
import { ElementPlusResolver } from "file:///D:/APP0/node_modules/unplugin-vue-components/dist/resolvers.js";
import path from "path";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve("./src")
    }
  },
  optimizeDeps: {
    include: ["element-plus", "sql.js", "xlsx", "dayjs"]
  },
  assetsInclude: ["**/*.wasm"],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // 产线级包体积优化
    chunkSizeWarningLimit: 1e3,
    // 关键：使用相对路径，确保 Electron 能正确加载
    base: "./",
    rollupOptions: {
      output: {
        // 智能代码分割策略
        manualChunks: {
          // 第三方库分包
          "vendor-vue": ["vue", "pinia"],
          "vendor-ui": ["element-plus", "@element-plus/icons-vue"],
          "vendor-chart": ["echarts"],
          "vendor-xlsx": ["xlsx"],
          "vendor-pdf": ["html2canvas", "jspdf"],
          "vendor-time": ["dayjs"],
          "vendor-db": ["sql.js"]
        },
        // 资源文件命名规则 - 使用相对路径格式
        entryFileNames: "js/[name]-[hash].js",
        chunkFileNames: "js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".");
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return "images/[name]-[hash][extname]";
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return "fonts/[name]-[hash][extname]";
          }
          if (ext === "css") {
            return "css/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        }
      }
    },
    // 压缩优化
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"]
      },
      format: {
        comments: false
      }
    },
    // 源码映射（生产环境关闭）
    sourcemap: false,
    // CSS 优化
    cssCodeSplit: true,
    cssMinify: true
  },
  server: {
    port: 5173
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxBUFAwXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxBUFAwXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9BUFAwL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xuaW1wb3J0IEF1dG9JbXBvcnQgZnJvbSAndW5wbHVnaW4tYXV0by1pbXBvcnQvdml0ZSdcbmltcG9ydCBDb21wb25lbnRzIGZyb20gJ3VucGx1Z2luLXZ1ZS1jb21wb25lbnRzL3ZpdGUnXG5pbXBvcnQgeyBFbGVtZW50UGx1c1Jlc29sdmVyIH0gZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvcmVzb2x2ZXJzJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSgpLFxuICAgIEF1dG9JbXBvcnQoe1xuICAgICAgcmVzb2x2ZXJzOiBbRWxlbWVudFBsdXNSZXNvbHZlcigpXSxcbiAgICB9KSxcbiAgICBDb21wb25lbnRzKHtcbiAgICAgIHJlc29sdmVyczogW0VsZW1lbnRQbHVzUmVzb2x2ZXIoKV0sXG4gICAgfSksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogWydlbGVtZW50LXBsdXMnLCAnc3FsLmpzJywgJ3hsc3gnLCAnZGF5anMnXSxcbiAgfSxcbiAgYXNzZXRzSW5jbHVkZTogWycqKi8qLndhc20nXSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICAvLyBcdTRFQTdcdTdFQkZcdTdFQTdcdTUzMDVcdTRGNTNcdTc5RUZcdTRGMThcdTUzMTZcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgLy8gXHU1MTczXHU5NTJFXHVGRjFBXHU0RjdGXHU3NTI4XHU3NkY4XHU1QkY5XHU4REVGXHU1Rjg0XHVGRjBDXHU3ODZFXHU0RkREIEVsZWN0cm9uIFx1ODBGRFx1NkI2M1x1Nzg2RVx1NTJBMFx1OEY3RFxuICAgIGJhc2U6ICcuLycsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIC8vIFx1NjY3QVx1ODBGRFx1NEVFM1x1NzgwMVx1NTIwNlx1NTI3Mlx1N0I1Nlx1NzU2NVxuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAvLyBcdTdCMkNcdTRFMDlcdTY1QjlcdTVFOTNcdTUyMDZcdTUzMDVcbiAgICAgICAgICAndmVuZG9yLXZ1ZSc6IFsndnVlJywgJ3BpbmlhJ10sXG4gICAgICAgICAgJ3ZlbmRvci11aSc6IFsnZWxlbWVudC1wbHVzJywgJ0BlbGVtZW50LXBsdXMvaWNvbnMtdnVlJ10sXG4gICAgICAgICAgJ3ZlbmRvci1jaGFydCc6IFsnZWNoYXJ0cyddLFxuICAgICAgICAgICd2ZW5kb3IteGxzeCc6IFsneGxzeCddLFxuICAgICAgICAgICd2ZW5kb3ItcGRmJzogWydodG1sMmNhbnZhcycsICdqc3BkZiddLFxuICAgICAgICAgICd2ZW5kb3ItdGltZSc6IFsnZGF5anMnXSxcbiAgICAgICAgICAndmVuZG9yLWRiJzogWydzcWwuanMnXSxcbiAgICAgICAgfSxcbiAgICAgICAgLy8gXHU4RDQ0XHU2RTkwXHU2NTg3XHU0RUY2XHU1NDdEXHU1NDBEXHU4OUM0XHU1MjE5IC0gXHU0RjdGXHU3NTI4XHU3NkY4XHU1QkY5XHU4REVGXHU1Rjg0XHU2ODNDXHU1RjBGXG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnanMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnanMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAoYXNzZXRJbmZvKSA9PiB7XG4gICAgICAgICAgY29uc3QgaW5mbyA9IGFzc2V0SW5mby5uYW1lLnNwbGl0KCcuJylcbiAgICAgICAgICBjb25zdCBleHQgPSBpbmZvW2luZm8ubGVuZ3RoIC0gMV1cbiAgICAgICAgICBpZiAoL1xcLihwbmd8anBlP2d8Z2lmfHN2Z3x3ZWJwfGljbykkL2kudGVzdChhc3NldEluZm8ubmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiAnaW1hZ2VzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV0nXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICgvXFwuKHdvZmYyP3xlb3R8dHRmfG90ZikkL2kudGVzdChhc3NldEluZm8ubmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiAnZm9udHMvW25hbWVdLVtoYXNoXVtleHRuYW1lXSdcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGV4dCA9PT0gJ2NzcycpIHtcbiAgICAgICAgICAgIHJldHVybiAnY3NzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV0nXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV0nXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgLy8gXHU1MzhCXHU3RjI5XHU0RjE4XHU1MzE2XG4gICAgbWluaWZ5OiAndGVyc2VyJyxcbiAgICB0ZXJzZXJPcHRpb25zOiB7XG4gICAgICBjb21wcmVzczoge1xuICAgICAgICBkcm9wX2NvbnNvbGU6IHRydWUsXG4gICAgICAgIGRyb3BfZGVidWdnZXI6IHRydWUsXG4gICAgICAgIHB1cmVfZnVuY3M6IFsnY29uc29sZS5sb2cnLCAnY29uc29sZS5pbmZvJywgJ2NvbnNvbGUuZGVidWcnXSxcbiAgICAgIH0sXG4gICAgICBmb3JtYXQ6IHtcbiAgICAgICAgY29tbWVudHM6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9LFxuICAgIC8vIFx1NkU5MFx1NzgwMVx1NjYyMFx1NUMwNFx1RkYwOFx1NzUxRlx1NEVBN1x1NzNBRlx1NTg4M1x1NTE3M1x1OTVFRFx1RkYwOVxuICAgIHNvdXJjZW1hcDogZmFsc2UsXG4gICAgLy8gQ1NTIFx1NEYxOFx1NTMxNlxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICBjc3NNaW5pZnk6IHRydWUsXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDUxNzMsXG4gIH0sXG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEyTSxTQUFTLG9CQUFvQjtBQUN4TyxPQUFPLFNBQVM7QUFDaEIsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxnQkFBZ0I7QUFDdkIsU0FBUywyQkFBMkI7QUFDcEMsT0FBTyxVQUFVO0FBRWpCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxJQUNKLFdBQVc7QUFBQSxNQUNULFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQztBQUFBLElBQ25DLENBQUM7QUFBQSxJQUNELFdBQVc7QUFBQSxNQUNULFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQztBQUFBLElBQ25DLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxPQUFPO0FBQUEsSUFDM0I7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsZ0JBQWdCLFVBQVUsUUFBUSxPQUFPO0FBQUEsRUFDckQ7QUFBQSxFQUNBLGVBQWUsQ0FBQyxXQUFXO0FBQUEsRUFDM0IsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBO0FBQUEsSUFFYix1QkFBdUI7QUFBQTtBQUFBLElBRXZCLE1BQU07QUFBQSxJQUNOLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQTtBQUFBLFFBRU4sY0FBYztBQUFBO0FBQUEsVUFFWixjQUFjLENBQUMsT0FBTyxPQUFPO0FBQUEsVUFDN0IsYUFBYSxDQUFDLGdCQUFnQix5QkFBeUI7QUFBQSxVQUN2RCxnQkFBZ0IsQ0FBQyxTQUFTO0FBQUEsVUFDMUIsZUFBZSxDQUFDLE1BQU07QUFBQSxVQUN0QixjQUFjLENBQUMsZUFBZSxPQUFPO0FBQUEsVUFDckMsZUFBZSxDQUFDLE9BQU87QUFBQSxVQUN2QixhQUFhLENBQUMsUUFBUTtBQUFBLFFBQ3hCO0FBQUE7QUFBQSxRQUVBLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQixDQUFDLGNBQWM7QUFDN0IsZ0JBQU0sT0FBTyxVQUFVLEtBQUssTUFBTSxHQUFHO0FBQ3JDLGdCQUFNLE1BQU0sS0FBSyxLQUFLLFNBQVMsQ0FBQztBQUNoQyxjQUFJLG1DQUFtQyxLQUFLLFVBQVUsSUFBSSxHQUFHO0FBQzNELG1CQUFPO0FBQUEsVUFDVDtBQUNBLGNBQUksMkJBQTJCLEtBQUssVUFBVSxJQUFJLEdBQUc7QUFDbkQsbUJBQU87QUFBQSxVQUNUO0FBQ0EsY0FBSSxRQUFRLE9BQU87QUFDakIsbUJBQU87QUFBQSxVQUNUO0FBQ0EsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsZUFBZTtBQUFBLFFBQ2YsWUFBWSxDQUFDLGVBQWUsZ0JBQWdCLGVBQWU7QUFBQSxNQUM3RDtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sVUFBVTtBQUFBLE1BQ1o7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLFdBQVc7QUFBQTtBQUFBLElBRVgsY0FBYztBQUFBLElBQ2QsV0FBVztBQUFBLEVBQ2I7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
