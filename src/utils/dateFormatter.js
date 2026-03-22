import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

const DATE_FORMATS = [
  'YYYYMMDD',
  'YYYY-MM-DD',
  'YYYY/MM/DD',
  'YYYY.MM.DD',
  'DD/MM/YYYY',
  'DD-MM-YYYY',
  'MM/DD/YYYY',
  'MM-DD-YYYY',
  'YYYY年MM月DD日',
  'DD MMM YYYY',
  'MMM DD YYYY',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY/MM/DD HH:mm:ss',
  'DD/MM/YYYY HH:mm:ss',
]

export function standardizeDate(value) {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, formatted: '', original: value, isDirty: false }
  }

  const original = String(value).trim()

  if (!original) {
    return { isValid: false, formatted: '', original: value, isDirty: false }
  }

  if (typeof value === 'number') {
    if (value > 40000 && value < 50000) {
      const date = dayjs('1899-12-30').add(value, 'day')
      if (date.isValid()) {
        return {
          isValid: true,
          formatted: date.format('YYYYMMDD'),
          original: value,
          isDirty: false,
        }
      }
    }

    if (/^\d{8}$/.test(original)) {
      const year = original.slice(0, 4)
      const month = original.slice(4, 6)
      const day = original.slice(6, 8)
      const date = dayjs(`${year}-${month}-${day}`, 'YYYY-MM-DD')
      if (date.isValid()) {
        return {
          isValid: true,
          formatted: date.format('YYYYMMDD'),
          original: value,
          isDirty: false,
        }
      }
    }
  }

  if (value instanceof Date) {
    const date = dayjs(value)
    if (date.isValid()) {
      return {
        isValid: true,
        formatted: date.format('YYYYMMDD'),
        original: value,
        isDirty: false,
      }
    }
  }

  for (const format of DATE_FORMATS) {
    const date = dayjs(original, format, true)
    if (date.isValid()) {
      return {
        isValid: true,
        formatted: date.format('YYYYMMDD'),
        original: value,
        isDirty: false,
      }
    }
  }

  const fuzzyDate = dayjs(original)
  if (fuzzyDate.isValid() && original.length > 5) {
    return {
      isValid: true,
      formatted: fuzzyDate.format('YYYYMMDD'),
      original: value,
      isDirty: false,
    }
  }

  return { isValid: false, formatted: original, original: value, isDirty: true }
}

export function detectDateColumn(sampleValues, threshold = 0.5) {
  if (!sampleValues || sampleValues.length === 0) return false

  let validCount = 0
  let totalCount = 0

  for (const value of sampleValues) {
    if (value !== null && value !== undefined && value !== '') {
      totalCount++
      const result = standardizeDate(value)
      if (result.isValid) {
        validCount++
      }
    }
  }

  if (totalCount === 0) return false

  return validCount / totalCount >= threshold
}

export function batchStandardizeDates(values, errorThreshold = 0.1) {
  if (!Array.isArray(values)) return { results: [], errorRate: 0, hasDirty: false }

  const results = values.map((value) => standardizeDate(value))

  const totalNonEmpty = results.filter((r) => r.original !== '' && r.original !== null && r.original !== undefined).length
  const dirtyCount = results.filter((r) => r.isDirty).length
  const errorRate = totalNonEmpty > 0 ? dirtyCount / totalNonEmpty : 0

  return {
    results: results.map((r) => r.formatted),
    errorRate,
    hasDirty: errorRate > errorThreshold,
  }
}
