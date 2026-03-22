import { formatPeriod } from '../../utils/formatters.js'

export function calculate(data, mapping, dateRange) {
  if (!data || data.length === 0) {
    return {
      allEmployees: [],
      statistics: {
        totalEmployees: 0,
        totalSales: 0,
        avgSales: 0,
        aboveAvgCount: 0,
        belowAvgCount: 0,
        topPerformer: '',
        bottomPerformer: '',
        maxGap: 0,
        period: formatPeriod(dateRange)
      }
    }
  }

  const employeeKey = mapping.employee
  const amountKey = mapping.amount

  const salesMap = new Map()

  for (const row of data) {
    const employee = row[employeeKey]
    const amount = parseFloat(row[amountKey])

    if (!employee || isNaN(amount) || amount === 0) {
      continue
    }

    const employeeName = String(employee).trim()
    if (!employeeName) continue

    if (salesMap.has(employeeName)) {
      salesMap.set(employeeName, salesMap.get(employeeName) + amount)
    } else {
      salesMap.set(employeeName, amount)
    }
  }

  const sortedEmployees = Array.from(salesMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const totalSales = sortedEmployees.reduce((sum, item) => sum + item.value, 0)
  const totalEmployees = sortedEmployees.length
  const avgSales = totalEmployees > 0 ? totalSales / totalEmployees : 0

  const allEmployees = sortedEmployees.map((item, index) => ({
    rank: index + 1,
    name: item.name,
    value: item.value,
    vsAvg: avgSales > 0 ? (item.value - avgSales) / avgSales : 0,
    isAboveAvg: item.value >= avgSales,
    isTop3: index < 3
  }))

  const aboveAvgCount = allEmployees.filter(e => e.isAboveAvg).length
  const belowAvgCount = totalEmployees - aboveAvgCount

  const topPerformer = allEmployees[0]?.name || ''
  const bottomPerformer = allEmployees[allEmployees.length - 1]?.name || ''
  const topValue = allEmployees[0]?.value || 0
  const bottomValue = allEmployees[allEmployees.length - 1]?.value || 1
  const maxGap = bottomValue > 0 ? topValue / bottomValue : 0

  return {
    allEmployees,
    statistics: {
      totalEmployees,
      totalSales,
      avgSales,
      aboveAvgCount,
      belowAvgCount,
      topPerformer,
      bottomPerformer,
      maxGap,
      period: formatPeriod(dateRange)
    }
  }
}
