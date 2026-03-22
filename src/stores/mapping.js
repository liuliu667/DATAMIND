import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { validateColumnType, parseNumber } from '../utils/dataValidator.js'

// 通用日期解析函数 - 将各种格式转换为 YYYYMMDD
function parseDateToYYYYMMDD(dateValue) {
  if (!dateValue) return null

  // 处理 JavaScript Date 对象
  if (dateValue instanceof Date) {
    return dayjs(dateValue).format('YYYYMMDD')
  }

  // 处理数值型日期（Excel 序列号）
  // Excel 序列号：1900-01-01 = 1，2024-01-01 ≈ 45234
  // 注意：Excel 有个 bug，认为 1900 是闰年，所以需要调整
  if (typeof dateValue === 'number' && dateValue > 0 && dateValue < 100000) {
    try {
      // Excel 序列号从 1900-01-01 开始，但 Excel 认为 1900 是闰年
      // 所以需要减去 1 天来修正
      const excelEpoch = dayjs('1899-12-30')
      const parsed = excelEpoch.add(dateValue, 'day')
      if (parsed.isValid()) {
        return parsed.format('YYYYMMDD')
      }
    } catch (e) {
      // 转换失败，尝试其他方式
    }
  }

  const dateStr = String(dateValue).trim()

  // 已经是 YYYYMMDD 格式
  if (/^\d{8}$/.test(dateStr)) {
    return dateStr
  }

  // 尝试解析 YYYY-MM-DD 格式
  let match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    return match[1] + match[2] + match[3]
  }

  // 尝试解析 YYYY/MM/DD 格式
  match = dateStr.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
  if (match) {
    return match[1] + match[2] + match[3]
  }

  // 尝试解析 MM/DD/YYYY 格式 (美式日期)
  match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (match) {
    return match[3] + match[1] + match[2]
  }

  // 尝试解析 YYYY年MM月DD日 格式
  match = dateStr.match(/^(\d{4})年(\d{2})月(\d{2})日$/)
  if (match) {
    return match[1] + match[2] + match[3]
  }

  // 尝试使用 dayjs 自动解析（宽松模式）
  const parsed = dayjs(dateStr)
  if (parsed.isValid()) {
    return parsed.format('YYYYMMDD')
  }

  return null
}

export const useMappingStore = defineStore('mapping', () => {
  const currentTemplate = ref(null)
  const mappings = ref({})
  const dateRange = ref({
    type: 'all',
    start: null,
    end: null
  })
  const excelHeaders = ref([])
  const excelData = ref([])
  const validationErrors = ref({})
  const calculationResult = ref(null)
  const isCalculating = ref(false)

  const hasDateMapping = computed(() => {
    return mappings.value.date !== undefined && mappings.value.date !== null
  })

  const isMappingComplete = computed(() => {
    if (!currentTemplate.value) return false

    for (const field of currentTemplate.value.requiredFields) {
      if (mappings.value[field.key] === undefined || mappings.value[field.key] === null) {
        return false
      }
    }

    return true
  })

  const mappedData = computed(() => {
    if (!isMappingComplete.value) return []

    let data = excelData.value

    if (hasDateMapping.value && dateRange.value.type !== 'all') {
      data = filterDataByDate(data)
    }

    return data.map(row => {
      const obj = {}

      for (const [key, columnIndex] of Object.entries(mappings.value)) {
        if (columnIndex !== undefined && columnIndex !== null) {
          const field = getFieldConfig(key)
          let value = row[columnIndex]

          if (field && field.type === 'number') {
            value = parseNumber(value)
          }

          obj[key] = value
        }
      }

      return obj
    })
  })

  const mappingConfig = computed(() => {
    return {
      template: currentTemplate.value,
      mappings: mappings.value,
      dateRange: dateRange.value,
      headers: excelHeaders.value,
      hasDateMapping: hasDateMapping.value
    }
  })

  function getFieldConfig(key) {
    if (!currentTemplate.value) return null

    const allFields = [
      ...currentTemplate.value.requiredFields,
      ...currentTemplate.value.optionalFields
    ]

    return allFields.find(f => f.key === key)
  }

  function setTemplate(template) {
    currentTemplate.value = template
    mappings.value = {}
    validationErrors.value = {}
    calculationResult.value = null
  }

  function setMapping(fieldKey, columnIndex) {
    if (columnIndex === null || columnIndex === undefined) {
      delete mappings.value[fieldKey]
    } else {
      mappings.value[fieldKey] = columnIndex
    }

    validateField(fieldKey, columnIndex)
  }

  function validateField(fieldKey, columnIndex) {
    if (columnIndex === null || columnIndex === undefined) {
      delete validationErrors.value[fieldKey]
      return
    }

    const field = getFieldConfig(fieldKey)
    if (!field) return

    const result = validateColumnType(excelData.value, columnIndex, field.type)

    if (!result.valid) {
      validationErrors.value[fieldKey] = {
        message: `该列 ${(result.errorRate * 100).toFixed(0)}% 的数据不是有效的${getTypeDescription(field.type)}`,
        errorRate: result.errorRate,
        sampleErrors: result.sampleErrors
      }
    } else {
      delete validationErrors.value[fieldKey]
    }
  }

  function getTypeDescription(type) {
    const descriptions = {
      number: '数字',
      date: '日期',
      string: '文本'
    }
    return descriptions[type] || type
  }

  function validateMappings() {
    const errors = {}

    if (!currentTemplate.value) {
      errors.general = '请先选择模板'
      return { valid: false, errors }
    }

    for (const field of currentTemplate.value.requiredFields) {
      if (mappings.value[field.key] === undefined || mappings.value[field.key] === null) {
        errors[field.key] = `请映射${field.label}`
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  function transformDataToMappedFormat(data) {
    return data.map(row => {
      const obj = {}
      for (const [key, columnIndex] of Object.entries(mappings.value)) {
        if (columnIndex !== undefined && columnIndex !== null) {
          obj[key] = row[columnIndex]
        }
      }
      return obj
    })
  }

  function buildMappingForCalculator() {
    const result = {}
    for (const [key, columnIndex] of Object.entries(mappings.value)) {
      if (columnIndex !== undefined && columnIndex !== null) {
        result[key] = key
      }
    }
    return result
  }

  function filterDataByDate(data) {
    if (!hasDateMapping.value || !dateRange.value.start || !dateRange.value.end) {
      return data
    }

    const dateColumnIndex = mappings.value.date
    const startDateStr = dateRange.value.start
    const endDateStr = dateRange.value.end

    return data.filter(row => {
      const dateValue = row[dateColumnIndex]
      const rowDateStr = parseDateToYYYYMMDD(dateValue)

      if (!rowDateStr) return false

      return rowDateStr >= startDateStr && rowDateStr <= endDateStr
    })
  }

  function setDateRange(type, start = null, end = null) {
    dateRange.value.type = type

    switch (type) {
      case 'thisMonth':
        dateRange.value.start = dayjs().startOf('month').format('YYYYMMDD')
        dateRange.value.end = dayjs().endOf('month').format('YYYYMMDD')
        break
      case 'thisQuarter':
        dateRange.value.start = dayjs().startOf('quarter').format('YYYYMMDD')
        dateRange.value.end = dayjs().endOf('quarter').format('YYYYMMDD')
        break
      case 'last30Days':
        dateRange.value.start = dayjs().subtract(30, 'day').format('YYYYMMDD')
        dateRange.value.end = dayjs().format('YYYYMMDD')
        break
      case 'custom':
        dateRange.value.start = start
        dateRange.value.end = end
        break
      default:
        dateRange.value.start = null
        dateRange.value.end = null
    }
  }

  function setExcelData(headers, data) {
    excelHeaders.value = headers
    excelData.value = data
  }

  /**
   * @deprecated 此函数未使用数据格式转换，请使用 calculateResultsWithComparison
   * 遗留函数，仅作备份保留
   */
  async function _deprecated_calculateResults() {
    if (!hasDateMapping.value || excelData.value.length === 0) {
      calculationResult.value = null
      return
    }

    isCalculating.value = true

    try {
      let data = excelData.value

      if (hasDateMapping.value && dateRange.value.type !== 'all') {
        data = filterDataByDate(data)
      }

      let result = null

      if (currentTemplate.value?.id === 'top10') {
        const { calculate: calculateTop10 } = await import('../templates/top10/calculator.js')
        result = calculateTop10(data, mappings.value, dateRange.value)
      } else if (currentTemplate.value?.id === 'product') {
        const { calculate: calculateProduct } = await import('../templates/product/calculator.js')
        result = calculateProduct(data, mappings.value, dateRange.value)
      } else if (currentTemplate.value?.id === 'comparison') {
        const { calculate: calculateComparison } = await import('../templates/comparison/calculator.js')
        result = calculateComparison(data, mappings.value, dateRange.value)
      } else if (currentTemplate.value?.id === 'region') {
        const { calculate: calculateRegion } = await import('../templates/region/calculator.js')
        result = calculateRegion(data, mappings.value, dateRange.value)
      }

      if (result) {
        result.hasDateMapping = hasDateMapping.value
        calculationResult.value = result
      }
    } catch (error) {
      console.error('计算失败:', error)
    } finally {
      isCalculating.value = false
    }
  }

  function calculatePreviousPeriod(targetStart, targetEnd) {
    if (!targetStart || !targetEnd) return null

    const start = dayjs(targetStart, 'YYYYMMDD')
    const end = dayjs(targetEnd, 'YYYYMMDD')
    const days = end.diff(start, 'day') + 1

    const prevStart = start.subtract(days, 'day').format('YYYYMMDD')
    const prevEnd = end.subtract(days, 'day').format('YYYYMMDD')

    return { start: prevStart, end: prevEnd }
  }

  async function calculateResultsWithComparison() {
    if (excelData.value.length === 0) {
      calculationResult.value = null
      return
    }

    isCalculating.value = true

    try {
      const allData = excelData.value
      const calcMapping = buildMappingForCalculator()

      const currentData = hasDateMapping.value && dateRange.value.type !== 'all'
        ? filterDataByDate(allData)
        : allData

      const currentDataMapped = transformDataToMappedFormat(currentData)

      let result = null

      if (currentTemplate.value?.id === 'top10') {
        const { calculate: calculateTop10 } = await import('../templates/top10/calculator.js')
        result = calculateTop10(currentDataMapped, calcMapping, dateRange.value)

        if (dateRange.value.type !== 'all' && dateRange.value.start && dateRange.value.end) {
          const prevRange = calculatePreviousPeriod(dateRange.value.start, dateRange.value.end)
          if (prevRange) {
            const prevData = allData.filter(row => {
              const dateVal = row[mappings.value.date]
              if (!dateVal) return false
              const date = parseDateToYYYYMMDD(dateVal)
              if (!date) return false
              return date >= prevRange.start && date <= prevRange.end
            })

            if (prevData.length > 0) {
              const prevDataMapped = transformDataToMappedFormat(prevData)
              const prevResult = calculateTop10(prevDataMapped, calcMapping, prevRange)
              result.previousStats = {
                ...prevResult.statistics,
                allEmployees: prevResult.allEmployees
              }
            }
          }
        }
      } else if (currentTemplate.value?.id === 'product') {
        const { calculate: calculateProduct } = await import('../templates/product/calculator.js')
        result = calculateProduct(currentDataMapped, calcMapping, dateRange.value)

        if (dateRange.value.type !== 'all' && dateRange.value.start && dateRange.value.end) {
          const prevRange = calculatePreviousPeriod(dateRange.value.start, dateRange.value.end)
          if (prevRange) {
            const prevData = allData.filter(row => {
              const dateVal = row[mappings.value.date]
              if (!dateVal) return false
              const date = parseDateToYYYYMMDD(dateVal)
              if (!date) return false
              return date >= prevRange.start && date <= prevRange.end
            })

            if (prevData.length > 0) {
              const prevDataMapped = transformDataToMappedFormat(prevData)
              const prevResult = calculateProduct(prevDataMapped, calcMapping, prevRange)
              result.previousStats = {
                ...prevResult.statistics,
                top10: prevResult.top10
              }
            }
          }
        }
      } else if (currentTemplate.value?.id === 'comparison') {
        const { calculate: calculateComparison } = await import('../templates/comparison/calculator.js')
        result = calculateComparison(currentDataMapped, calcMapping, dateRange.value)

        if (dateRange.value.type !== 'all' && dateRange.value.start && dateRange.value.end) {
          const prevRange = calculatePreviousPeriod(dateRange.value.start, dateRange.value.end)
          if (prevRange) {
            const prevData = allData.filter(row => {
              const dateVal = row[mappings.value.date]
              if (!dateVal) return false
              const date = parseDateToYYYYMMDD(dateVal)
              if (!date) return false
              return date >= prevRange.start && date <= prevRange.end
            })

            if (prevData.length > 0) {
              const prevDataMapped = transformDataToMappedFormat(prevData)
              const prevResult = calculateComparison(prevDataMapped, calcMapping, prevRange)
              result.previousStats = {
                ...prevResult.statistics,
                allEmployees: prevResult.allEmployees
              }
            }
          }
        }
      } else if (currentTemplate.value?.id === 'region') {
        const { calculate: calculateRegion } = await import('../templates/region/calculator.js')
        result = calculateRegion(currentDataMapped, calcMapping, dateRange.value)

        if (dateRange.value.type !== 'all' && dateRange.value.start && dateRange.value.end) {
          const prevRange = calculatePreviousPeriod(dateRange.value.start, dateRange.value.end)
          if (prevRange) {
            const prevData = allData.filter(row => {
              const dateVal = row[mappings.value.date]
              if (!dateVal) return false
              const date = parseDateToYYYYMMDD(dateVal)
              if (!date) return false
              return date >= prevRange.start && date <= prevRange.end
            })

            if (prevData.length > 0) {
              const prevDataMapped = transformDataToMappedFormat(prevData)
              const prevResult = calculateRegion(prevDataMapped, calcMapping, prevRange)
              result.previousStats = {
                ...prevResult.statistics,
                regions: prevResult.regions
              }
            }
          }
        }
      }

      if (result) {
        result.hasDateMapping = hasDateMapping.value
        calculationResult.value = result
      }
    } catch (error) {
      console.error('计算失败:', error)
    } finally {
      isCalculating.value = false
    }
  }

  function generateMappingConfig() {
    const validation = validateMappings()
    if (!validation.valid) {
      return { valid: false, errors: validation.errors }
    }

    return {
      valid: true,
      config: mappingConfig.value,
      data: mappedData.value,
      rowCount: mappedData.value.length
    }
  }

  // 获取 Excel 数据中日期列的实际范围
  function getDataDateRange() {
    if (!hasDateMapping.value || excelData.value.length === 0) {
      return null
    }

    const dateColumnIndex = mappings.value.date
    const dates = []

    for (const row of excelData.value) {
      const dateValue = row[dateColumnIndex]
      const parsedDate = parseDateToYYYYMMDD(dateValue)
      if (parsedDate) {
        dates.push(parsedDate)
      }
    }

    if (dates.length === 0) return null

    dates.sort()
    return {
      min: dates[0],
      max: dates[dates.length - 1]
    }
  }

  function reset() {
    currentTemplate.value = null
    mappings.value = {}
    dateRange.value = { type: 'all', start: null, end: null }
    excelHeaders.value = []
    excelData.value = []
    validationErrors.value = {}
    calculationResult.value = null
    isCalculating.value = false
  }

  return {
    currentTemplate,
    mappings,
    dateRange,
    excelHeaders,
    excelData,
    validationErrors,
    calculationResult,
    isCalculating,
    hasDateMapping,
    isMappingComplete,
    mappedData,
    mappingConfig,
    setTemplate,
    setMapping,
    validateMappings,
    setDateRange,
    setExcelData,
    calculateResultsWithComparison,
    generateMappingConfig,
    getFieldConfig,
    getDataDateRange,
    reset
  }
})
