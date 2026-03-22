export function validateColumnType(data, columnIndex, expectedType, sampleSize = 100) {
  if (!data || data.length === 0) {
    return { valid: false, errorRate: 1, sampleErrors: ['No data'] }
  }

  const sample = data.slice(0, Math.min(sampleSize, data.length))
  let errorCount = 0
  const sampleErrors = []
  const maxErrorsToShow = 3

  for (let i = 0; i < sample.length; i++) {
    const row = sample[i]
    const value = row[columnIndex]
    const isValid = validateValue(value, expectedType)

    if (!isValid) {
      errorCount++
      if (sampleErrors.length < maxErrorsToShow) {
        sampleErrors.push(`Row ${i + 1}: "${value}"`)
      }
    }
  }

  const errorRate = errorCount / sample.length

  return {
    valid: errorRate < 0.15,
    errorRate,
    sampleErrors,
    totalChecked: sample.length,
    errorCount
  }
}

function validateValue(value, expectedType) {
  if (value === null || value === undefined || value === '') {
    return true
  }

  const strValue = String(value).trim()

  if (strValue === '' || strValue === '-' || strValue === 'N/A' || strValue === 'n/a') {
    return true
  }

  switch (expectedType) {
    case 'number':
      return isValidNumber(strValue)
    case 'date':
      return isValidDate(strValue)
    case 'string':
      return true
    default:
      return true
  }
}

function isValidNumber(value) {
  const cleaned = String(value)
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .replace(/^\$/, '')
    .replace(/\$/, '')
    .replace(/￥/, '')
    .replace(/¥/, '')
    .replace(/€/, '')
    .replace(/£/, '')

  if (cleaned === '' || cleaned === '-') {
    return true
  }

  const num = Number(cleaned)
  return !isNaN(num) && isFinite(num)
}

function isValidDate(value) {
  if (value instanceof Date) {
    return !isNaN(value.getTime())
  }

  const strValue = String(value).trim()

  if (/^\d{8}$/.test(strValue)) {
    const year = parseInt(strValue.slice(0, 4))
    const month = parseInt(strValue.slice(4, 6))
    const day = parseInt(strValue.slice(6, 8))
    return month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100
  }

  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{4}\/\d{2}\/\d{2}$/,
    /^\d{4}\.\d{2}\.\d{2}$/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\d{2}-\d{2}-\d{4}$/,
    /^\d{4}年\d{2}月\d{2}日$/
  ]

  for (const pattern of datePatterns) {
    if (pattern.test(strValue)) {
      const date = new Date(strValue)
      return !isNaN(date.getTime())
    }
  }

  const date = new Date(strValue)
  return !isNaN(date.getTime())
}

export function parseNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  if (typeof value === 'number') {
    return value
  }

  const cleaned = String(value)
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .replace(/^\$/, '')
    .replace(/\$/, '')
    .replace(/￥/, '')
    .replace(/¥/, '')
    .replace(/€/, '')
    .replace(/£/, '')

  const num = Number(cleaned)
  return isNaN(num) ? 0 : num
}

export function getTypeDescription(type) {
  const descriptions = {
    number: '数字',
    date: '日期',
    string: '文本'
  }
  return descriptions[type] || type
}
