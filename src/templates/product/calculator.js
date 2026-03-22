import { formatPeriod } from '../../utils/formatters.js'

export function calculate(data, mapping, dateRange) {
  if (!data || data.length === 0) {
    return {
      top10: [],
      pareto: { top3Contribution: 0, top5Contribution: 0, longTailCount: 0 },
      statistics: {
        totalProducts: 0,
        totalSales: 0,
        avgSalesPerProduct: 0,
        starProduct: '',
        top1Value: 0,
        top1Contribution: 0,
        period: formatPeriod(dateRange)
      }
    }
  }

  const productKey = mapping.product
  const amountKey = mapping.amount

  const salesMap = new Map()

  for (const row of data) {
    const product = row[productKey]
    const amount = parseFloat(row[amountKey])

    if (!product || isNaN(amount) || amount === 0) {
      continue
    }

    const productName = String(product).trim()
    if (!productName) continue

    if (salesMap.has(productName)) {
      salesMap.set(productName, salesMap.get(productName) + amount)
    } else {
      salesMap.set(productName, amount)
    }
  }

  const sortedProducts = Array.from(salesMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const totalSales = sortedProducts.reduce((sum, item) => sum + item.value, 0)

  let cumulativeContribution = 0
  const top10 = sortedProducts.slice(0, 10).map((item, index) => {
    const contribution = totalSales > 0 ? item.value / totalSales : 0
    cumulativeContribution += contribution

    return {
      rank: index + 1,
      name: item.name,
      value: item.value,
      contribution,
      cumulativeContribution,
      isTop3: index < 3
    }
  })

  const top3Contribution = top10.slice(0, 3).reduce((sum, item) => sum + item.contribution, 0)
  const top5Contribution = top10.slice(0, 5).reduce((sum, item) => sum + item.contribution, 0)

  const longTailCount = sortedProducts.filter(item => {
    const contribution = totalSales > 0 ? item.value / totalSales : 0
    return contribution < 0.05
  }).length

  const top1 = top10[0] || { name: '', value: 0, contribution: 0 }

  return {
    top10,
    pareto: {
      top3Contribution,
      top5Contribution,
      longTailCount
    },
    statistics: {
      totalProducts: sortedProducts.length,
      totalSales,
      avgSalesPerProduct: sortedProducts.length > 0 ? totalSales / sortedProducts.length : 0,
      starProduct: top1.name,
      top1Value: top1.value,
      top1Contribution: top1.contribution,
      period: formatPeriod(dateRange)
    }
  }
}
