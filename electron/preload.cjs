const { contextBridge, ipcRenderer } = require('electron')

const wasmPathArg = process.argv.find(arg => arg.startsWith('wasm-path='))
const wasmPath = wasmPathArg ? wasmPathArg.replace('wasm-path=', '') : ''

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  nodeVersion: process.versions.node,
  electronVersion: process.versions.electron,
  wasmPath: wasmPath,

  // 统一的文件保存接口
  saveFile: (params) => ipcRenderer.invoke('save-file', params),

  dbQuery: async (sql) => {
    return new Promise((resolve) => {
      resolve({ success: true, data: [], message: 'Mock query executed' })
    })
  },

  dbSave: async (data) => {
    return new Promise((resolve) => {
      resolve({ success: true, message: 'Mock save executed' })
    })
  },
})

console.log('Preload script loaded successfully')
console.log('WASM path exposed:', wasmPath)
