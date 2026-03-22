import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// 数据库路径
const dbPath = path.join(app.getPath('userData'), 'datamind.db')

// 关键修复：简化路径逻辑，禁用 asar 后路径直接指向 resources/app
const resourcesPath = isDev 
  ? path.join(__dirname, '..')  // 开发时：项目根目录
  : path.join(process.resourcesPath, 'app')  // 打包后：resources/app 目录

// dist 目录路径（禁用 asar 后，dist 是真实文件夹）
const distPath = path.join(resourcesPath, 'dist')

// WASM 文件路径
const wasmPath = isDev
  ? path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm')
  : path.join(process.resourcesPath, 'sql-wasm.wasm')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'DataMind V1.1',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,  // 禁用 sandbox 以允许本地资源加载
      webSecurity: false,  // 禁用 webSecurity 以允许 file:// 协议加载本地资源
      preload: path.join(__dirname, 'preload.cjs'),
      additionalArguments: [`wasm-path=${wasmPath}`]
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    const indexPath = path.join(distPath, 'index.html')
    mainWindow.loadFile(indexPath)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: '视图',
      submenu: [
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.reload()
            }
          },
        },
        {
          label: '开发者工具',
          accelerator: 'F12',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools()
            }
          },
        },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 DataMind',
              message: 'DataMind V1.1',
              detail: 'DATAMind 企业数智决策平台\n\n基于 Electron + Vue3 + Element Plus 构建\n版权所有 © 2024 奶酪数智',
            })
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  createWindow()
  createMenu()
  setupIpcHandlers()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function setupIpcHandlers() {
  ipcMain.handle('save-file', async (event, { buffer, filename, filters }) => {
    try {
      const defaultPath = path.join(app.getPath('desktop'), filename)

      const { filePath, canceled } = await dialog.showSaveDialog({
        defaultPath: defaultPath,
        filters: filters || [{ name: 'All Files', extensions: ['*'] }]
      })

      if (canceled) return { success: false, reason: 'user_cancelled' }

      try {
        let nodeBuffer
        if (Buffer.isBuffer(buffer)) {
          nodeBuffer = buffer
        } else if (buffer instanceof Uint8Array) {
          nodeBuffer = Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength)
        } else if (buffer && typeof buffer === 'object' && buffer.type === 'Buffer') {
          nodeBuffer = Buffer.from(buffer.data)
        } else if (Array.isArray(buffer)) {
          nodeBuffer = Buffer.from(buffer)
        } else {
          throw new Error(`不支持的 buffer 类型: ${typeof buffer}`)
        }

        fs.writeFileSync(filePath, nodeBuffer)
        return { success: true, filePath }
      } catch (writeError) {
        console.error('【Main】文件写入错误:', writeError)
        return { success: false, reason: 'write_error', error: writeError.message }
      }
    } catch (error) {
      console.error('【Main】保存文件错误:', error)
      return { success: false, reason: 'dialog_error', error: error.message }
    }
  })

  ipcMain.handle('save-array-buffer', async (event, { arrayBuffer, filename, filters }) => {
    try {
      const defaultPath = path.join(app.getPath('desktop'), filename)

      const { filePath, canceled } = await dialog.showSaveDialog({
        defaultPath: defaultPath,
        filters: filters || [{ name: 'All Files', extensions: ['*'] }]
      })

      if (canceled) return { success: false, reason: 'user_cancelled' }

      try {
        let buffer
        if (arrayBuffer instanceof ArrayBuffer) {
          buffer = Buffer.from(arrayBuffer)
        } else if (arrayBuffer && typeof arrayBuffer === 'object') {
          const data = arrayBuffer.data || arrayBuffer
          if (Array.isArray(data)) {
            buffer = Buffer.from(data)
          } else {
            throw new Error('无法识别的 ArrayBuffer 格式')
          }
        } else {
          throw new Error(`不支持的类型: ${typeof arrayBuffer}`)
        }

        fs.writeFileSync(filePath, buffer)
        return { success: true, filePath }
      } catch (writeError) {
        console.error('【Main】文件写入错误:', writeError)
        return { success: false, reason: 'write_error', error: writeError.message }
      }
    } catch (error) {
      console.error('【Main】保存文件错误:', error)
      return { success: false, reason: 'dialog_error', error: error.message }
    }
  })
}
