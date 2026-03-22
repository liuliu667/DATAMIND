import * as XLSX from 'xlsx/xlsx.mjs'

function formatMoney(value) {
  if (value === undefined || value === null) return 0
  return Number(value)
}

function formatPercent(value) {
  if (value === undefined || value === null) return 0
  return value
}

export function exportExcel(dataArray, filename, templateId) {
  if (!dataArray || dataArray.length === 0) {
    throw new Error('没有可导出的数据')
  }

  const worksheetData = buildWorksheetData(dataArray, templateId)

  const worksheet = XLSX.utils.json_to_sheet(worksheetData)

  const range = XLSX.utils.decode_range(worksheet['!ref'])
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: C })]
    if (cell) {
      cell.s = {
        font: { bold: true },
        fill: { fgColor: { rgb: '409EFF' } },
        alignment: { horizontal: 'center' }
      }
    }
  }

  worksheet['!cols'] = worksheetData[0] ? Object.keys(worksheetData[0]).map(() => ({ wch: 20 })) : []

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '数据明细')

  const finalFilename = filename || `DATAMIND_Export_${Date.now()}.xlsx`

  // 使用 buffer 类型生成 Excel 数据，确保是 Uint8Array
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

  // 确保转换为 Uint8Array（处理 XLSX 可能返回的不同类型）
  const uint8Array = new Uint8Array(excelBuffer)

  if (window.electronAPI?.saveFile) {
    return window.electronAPI.saveFile({
      buffer: uint8Array,
      filename: finalFilename,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    })
  } else {
    // 降级处理：浏览器环境使用 XLSX.writeFile
    XLSX.writeFile(workbook, finalFilename)
    return { success: true, filename: finalFilename }
  }
}

function buildWorksheetData(dataArray, templateId) {
  switch (templateId) {
    case 'top10':
      return dataArray.map((item, index) => ({
        '排名': item.rank || index + 1,
        '名称': item.name || '-',
        '销售额': formatMoney(item.value),
        '占比': formatPercent(item.contribution),
        '累计占比': formatPercent(item.cumulativeContribution)
      }))

    case 'product':
      return dataArray.map((item, index) => ({
        '排名': item.rank || index + 1,
        '产品名称': item.name || '-',
        '销售额': formatMoney(item.value),
        '占比': formatPercent(item.contribution),
        '累计占比': formatPercent(item.cumulativeContribution),
        '明星产品': item.isTop3 ? '是' : '否'
      }))

    case 'comparison':
      return dataArray.map((item, index) => ({
        '排名': item.rank || index + 1,
        '员工姓名': item.name || '-',
        '销售额': formatMoney(item.value),
        'vs平均': (item.vsAvg > 0 ? '+' : '') + formatPercent(item.vsAvg),
        '达标状态': item.isAboveAvg ? '达标' : '未达标',
        'TOP3': item.isTop3 ? '是' : '否'
      }))

    case 'region':
      return dataArray.map((item, index) => ({
        '排名': item.rank || index + 1,
        '区域': item.name || '-',
        '销售额': formatMoney(item.value),
        '占比': formatPercent(item.contribution)
      }))

    default:
      return dataArray
  }
}

export function exportRawData(rawData, filename) {
  if (!rawData || rawData.length === 0) {
    throw new Error('没有可导出的数据')
  }

  const worksheet = XLSX.utils.json_to_sheet(rawData)

  const range = XLSX.utils.decode_range(worksheet['!ref'])
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: C })]
    if (cell) {
      cell.s = {
        font: { bold: true },
        fill: { fgColor: { rgb: '409EFF' } }
      }
    }
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '原始数据')

  const finalFilename = filename || `DATAMIND_RawData_${Date.now()}.xlsx`

  // 使用 buffer 类型生成 Excel 数据，确保是 Uint8Array
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

  // 确保转换为 Uint8Array（处理 XLSX 可能返回的不同类型）
  const uint8Array = new Uint8Array(excelBuffer)

  if (window.electronAPI?.saveFile) {
    return window.electronAPI.saveFile({
      buffer: uint8Array,
      filename: finalFilename,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    })
  } else {
    // 降级处理：浏览器环境使用 XLSX.writeFile
    XLSX.writeFile(workbook, finalFilename)
    return { success: true, filename: finalFilename }
  }
}
