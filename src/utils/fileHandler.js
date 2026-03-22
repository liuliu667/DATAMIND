import * as XLSX from 'xlsx/xlsx.mjs'

const TIMEOUT_MS = 5 * 60 * 1000
const MAX_ROWS = 150000
const PREVIEW_ROWS = 100

export const ErrorCodes = {
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  DATA_TOO_LARGE: 'DATA_TOO_LARGE',
  PARSE_ERROR: 'PARSE_ERROR',
  TIMEOUT: 'TIMEOUT',
  EMPTY_FILE: 'EMPTY_FILE',
  UNKNOWN_TYPE: 'UNKNOWN_TYPE',
}

export class FileHandlerError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.code = code
    this.details = details
    this.name = 'FileHandlerError'
  }
}

export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new FileHandlerError(
          ErrorCodes.TIMEOUT,
          '解析超时，文件可能过大或已损坏'
        )
      )
    }, TIMEOUT_MS)

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        clearTimeout(timeoutId)

        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new FileHandlerError(ErrorCodes.EMPTY_FILE, '文件中没有工作表'))
          return
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        // raw: false 将日期转换为格式化字符串，避免 JavaScript Date 对象
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: false })

        if (!jsonData || jsonData.length === 0) {
          reject(new FileHandlerError(ErrorCodes.EMPTY_FILE, '文件为空'))
          return
        }

        const headers = jsonData[0].map((h, i) => ({
          index: i,
          name: String(h || `列${i + 1}`).trim(),
        }))

        const rawData = jsonData.slice(1).filter((row) =>
          row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
        )

        const rowCount = rawData.length

        if (rowCount > MAX_ROWS) {
          reject(
            new FileHandlerError(
              ErrorCodes.DATA_TOO_LARGE,
              `数据行数 ${rowCount.toLocaleString()} 超过限制 ${MAX_ROWS.toLocaleString()}`,
              { actualRows: rowCount, maxRows: MAX_ROWS }
            )
          )
          return
        }

        const preview = rawData.slice(0, PREVIEW_ROWS).map((row) => {
          const obj = {}
          headers.forEach((h) => {
            obj[h.name] = row[h.index] !== undefined ? row[h.index] : ''
          })
          return obj
        })

        // 检测日期列
        const dateColumns = []
        const dirtyColumns = []

        headers.forEach((h) => {
          const sampleValues = rawData
            .slice(0, 100)
            .map((row) => row[h.index])
            .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')

          if (sampleValues.length === 0) return

          // 支持多种日期格式：YYYYMMDD, YYYY-MM-DD, YYYY/MM/DD, YYYY年MM月DD日, MM/DD/YYYY
          const datePattern = /^\d{8}$|^\d{4}-\d{2}-\d{2}$|^\d{4}\/\d{2}\/\d{2}$|^\d{4}年\d{2}月\d{2}日$|^\d{2}\/\d{2}\/\d{4}$/
          const dateLikeValues = sampleValues.filter((v) => datePattern.test(String(v).trim()))

          if (dateLikeValues.length > sampleValues.length * 0.5) {
            dateColumns.push(h.name)
          }
        })

        const headersList = headers.map((h) => h.name)

        resolve({
          meta: {
            fileName: file.name,
            fileSize: file.size,
            rowCount: rowCount,
            colCount: headers.length,
            sheetName: workbook.SheetNames[0],
            dateColumns: dateColumns,
            dirtyColumns: dirtyColumns,
            headers: headersList,
          },
          preview: preview,
          rawData: rawData,
          headers: headersList,
        })
      } catch (error) {
        clearTimeout(timeoutId)
        console.error('Parse error:', error)
        reject(
          new FileHandlerError(
            ErrorCodes.PARSE_ERROR,
            error.message || '解析 Excel 文件失败'
          )
        )
      }
    }

    reader.onerror = () => {
      clearTimeout(timeoutId)
      reject(
        new FileHandlerError(
          ErrorCodes.FILE_READ_ERROR,
          '读取文件失败'
        )
      )
    }

    reader.readAsArrayBuffer(file)
  })
}

export function validateFile(file) {
  if (!file) {
    return { valid: false, error: '未选择文件' }
  }

  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    return {
      valid: false,
      error: '仅支持 .xlsx 和 .xls 格式的 Excel 文件',
    }
  }

  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `文件大小超过 100MB 限制 (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
    }
  }

  return { valid: true }
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatRowCount(count) {
  return count.toLocaleString()
}

// 兼容旧代码的空函数
export function terminateWorker() {
  // Worker 已移除，此函数保留用于兼容性
}
