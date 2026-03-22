/**
 * 智能数字格式化 - 根据数值大小自动选择合适单位
 * 小于1: 保留4位小数
 * 1-9999: 保留2位小数
 * 10000-99999999: 万单位
 * 大于1亿: 亿单位
 */
export function formatSmartNumber(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'
  }

  const num = parseFloat(value)
  const absNum = Math.abs(num)

  // 亿级
  if (absNum >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿'
  }

  // 万级
  if (absNum >= 10000) {
    return (num / 10000).toFixed(2) + '万'
  }

  // 个级 - 根据大小决定精度
  if (absNum >= 100) {
    return num.toFixed(1).replace(/\.?0+$/, '')
  }

  if (absNum >= 1) {
    return num.toFixed(2).replace(/\.?0+$/, '')
  }

  // 小于1的小数 - 保留4位精度
  return num.toFixed(4).replace(/\.?0+$/, '')
}

/**
 * 精确数值显示 - 始终显示原始值，带千分位
 * 用于表格等需要精确数据的场景
 */
export function formatExact(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'
  }
  const num = parseFloat(value)
  return num.toLocaleString('zh-CN', {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0
  })
}

/**
 * 百分比格式化
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0%'
  }

  return (value * 100).toFixed(decimals) + '%'
}

/**
 * 基础数字格式化 - 仅千分位
 */
export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'
  }

  return parseFloat(value).toLocaleString('zh-CN')
}

// 以下函数保留用于向后兼容，但内部实现已改为智能单位
export function formatMoney(value) {
  return formatSmartNumber(value)
}

export function formatMoneyExact(value) {
  return formatExact(value)
}

export function formatChange(current, previous) {
  if (current === null || current === undefined || isNaN(current) ||
      previous === null || previous === undefined || isNaN(previous) ||
      previous === 0) {
    return null
  }
  const change = (current - previous) / previous
  return change
}

export function formatChangeText(current, previous) {
  const change = formatChange(current, previous)
  if (change === null) {
    return { text: '无数据', value: null, isPositive: false }
  }
  const percent = Math.abs(change * 100).toFixed(1)
  const isPositive = change > 0
  const isZero = Math.abs(change) < 0.0001
  if (isZero) {
    return { text: '持平', value: change, isPositive: false }
  }
  return {
    text: `${isPositive ? '↑' : '↓'}${percent}%`,
    value: change,
    isPositive
  }
}

export function formatPeriod(dateRange) {
  if (!dateRange || dateRange.type === 'all' || !dateRange.start || !dateRange.end) {
    return '全部时间'
  }

  const start = dateRange.start
  const end = dateRange.end

  const startYear = start.slice(0, 4)
  const startMonth = start.slice(4, 6)
  const startDay = start.slice(6, 8)

  const endYear = end.slice(0, 4)
  const endMonth = end.slice(4, 6)
  const endDay = end.slice(6, 8)

  if (startYear === endYear && startMonth === endMonth) {
    return `${startYear}年${parseInt(startMonth)}月`
  }

  return `${startYear}年${parseInt(startMonth)}月${parseInt(startDay)}日 - ${endYear}年${parseInt(endMonth)}月${parseInt(endDay)}日`
}
