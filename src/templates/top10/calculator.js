import { formatPeriod } from '../../utils/formatters.js'

export function calculate(data, mapping, dateRange) {
  if (!data || data.length === 0) {
    return {
      top10: [],
      allEmployees: [],
      statistics: {
        totalSales: 0,
        avgSales: 0,
        top1Name: '',
        top1Value: 0,
        top1VsAvg: 0,
        top1Contribution: 0,
        period: formatPeriod(dateRange)
      },
      hasProductData: false,
      employeeProducts: {}
    }
  }

  const employeeKey = mapping.employee
  const amountKey = mapping.amount
  const productKey = mapping.product
  const hasProductData = !!productKey

  const salesMap = new Map()
  const employeeProductMap = new Map()

  for (const row of data) {
    const employee = row[employeeKey]
    const amount = parseFloat(row[amountKey])
    const product = productKey ? row[productKey] : null

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

    if (hasProductData && product) {
      const productName = String(product).trim()
      if (productName) {
        if (!employeeProductMap.has(employeeName)) {
          employeeProductMap.set(employeeName, new Map())
        }
        const productSales = employeeProductMap.get(employeeName)
        if (productSales.has(productName)) {
          productSales.set(productName, productSales.get(productName) + amount)
        } else {
          productSales.set(productName, amount)
        }
      }
    }
  }

  const sortedSales = Array.from(salesMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const totalSales = sortedSales.reduce((sum, item) => sum + item.value, 0)
  const avgSales = sortedSales.length > 0 ? totalSales / sortedSales.length : 0

  function buildProductDistribution(productMap, totalValue) {
    if (!productMap || productMap.size === 0) return { topProducts: [], allProducts: [] }
    
    const sortedProducts = Array.from(productMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    const allProducts = sortedProducts.map(item => ({
      name: item.name,
      value: item.value,
      contribution: totalValue > 0 ? item.value / totalValue : 0
    }))

    const topProducts = allProducts.slice(0, 3).map((item, index) => ({
      rank: index + 1,
      ...item
    }))

    return { topProducts, allProducts }
  }

  const employeeProducts = {}
  if (hasProductData) {
    for (const [employeeName, productMap] of employeeProductMap.entries()) {
      const totalValue = salesMap.get(employeeName) || 0
      employeeProducts[employeeName] = buildProductDistribution(productMap, totalValue)
    }
  }

  const allEmployees = sortedSales.map((item, index) => {
    const productDist = hasProductData && employeeProducts[item.name] 
      ? employeeProducts[item.name] 
      : { topProducts: [], allProducts: [] }
    
    return {
      rank: index + 1,
      name: item.name,
      value: item.value,
      contribution: totalSales > 0 ? item.value / totalSales : 0,
      vsAvg: avgSales > 0 ? (item.value - avgSales) / avgSales : 0,
      topProducts: productDist.topProducts,
      allProducts: productDist.allProducts
    }
  })

  const top10 = allEmployees.slice(0, 10)

  const top1 = allEmployees[0] || { name: '', value: 0, contribution: 0, vsAvg: 0 }

  return {
    top10,
    allEmployees,
    statistics: {
      totalSales,
      avgSales,
      top1Name: top1.name,
      top1Value: top1.value,
      top1VsAvg: top1.vsAvg,
      top1Contribution: top1.contribution,
      period: formatPeriod(dateRange),
      totalEmployees: sortedSales.length
    },
    hasProductData,
    employeeProducts
  }
}
