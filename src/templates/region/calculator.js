import { formatPeriod } from '../../utils/formatters.js'

export function calculate(data, mapping, dateRange) {
  if (!data || data.length === 0) {
    return {
      regions: [],
      statistics: {
        totalRegions: 0,
        totalSales: 0,
        topRegion: '',
        topContribution: 0,
        bottomRegion: '',
        bottomContribution: 0,
        concentration: 'low',
        period: formatPeriod(dateRange)
      },
      hasProductData: false,
      regionProducts: {}
    }
  }

  const regionKey = mapping.region
  const amountKey = mapping.amount
  const productKey = mapping.product
  const hasProductData = !!productKey

  const salesMap = new Map()
  const regionProductMap = new Map()

  for (const row of data) {
    const region = row[regionKey]
    const amount = parseFloat(row[amountKey])
    const product = productKey ? row[productKey] : null

    if (!region || isNaN(amount) || amount === 0) {
      continue
    }

    const regionName = String(region).trim()
    if (!regionName) continue

    if (salesMap.has(regionName)) {
      salesMap.set(regionName, salesMap.get(regionName) + amount)
    } else {
      salesMap.set(regionName, amount)
    }

    if (hasProductData && product) {
      const productName = String(product).trim()
      if (productName) {
        if (!regionProductMap.has(regionName)) {
          regionProductMap.set(regionName, new Map())
        }
        const productSales = regionProductMap.get(regionName)
        if (productSales.has(productName)) {
          productSales.set(productName, productSales.get(productName) + amount)
        } else {
          productSales.set(productName, amount)
        }
      }
    }
  }

  const sortedRegions = Array.from(salesMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const totalSales = sortedRegions.reduce((sum, item) => sum + item.value, 0)

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

  const regionProducts = {}
  if (hasProductData) {
    for (const [regionName, productMap] of regionProductMap.entries()) {
      const totalValue = salesMap.get(regionName) || 0
      regionProducts[regionName] = buildProductDistribution(productMap, totalValue)
    }
  }

  const regions = sortedRegions.map((item, index) => {
    const productDist = hasProductData && regionProducts[item.name] 
      ? regionProducts[item.name] 
      : { topProducts: [], allProducts: [] }
    
    return {
      rank: index + 1,
      name: item.name,
      value: item.value,
      contribution: totalSales > 0 ? item.value / totalSales : 0,
      topProducts: productDist.topProducts,
      allProducts: productDist.allProducts
    }
  })

  const topRegion = regions[0] || { name: '', contribution: 0 }
  const bottomRegion = regions[regions.length - 1] || { name: '', contribution: 0 }

  const concentration = topRegion.contribution > 0.4 ? 'high' : 'low'

  return {
    regions,
    statistics: {
      totalRegions: regions.length,
      totalSales,
      topRegion: topRegion.name,
      topContribution: topRegion.contribution,
      bottomRegion: bottomRegion.name,
      bottomContribution: bottomRegion.contribution,
      concentration,
      period: formatPeriod(dateRange)
    },
    hasProductData,
    regionProducts
  }
}
