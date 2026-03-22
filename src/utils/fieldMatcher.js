const keywords = {
  employee: ['名', '员', '工', '销售', '人', 'name', 'user', 'seller', 'rep', 'staff', 'employee'],
  amount: ['额', '钱', '金', '元', 'amount', 'sales', 'value', 'price', 'revenue', 'total', 'sum', '金额', '价格', '收入'],
  product: ['产品', '商品', '货', '品名', 'product', 'item', 'goods', 'sku', 'name', '商品名'],
  region: ['区', '省', '市', '地', '城', 'region', 'area', 'city', 'province', 'location', '地址', '地区'],
  date: ['日', '期', '时间', 'date', 'time', 'day', 'month', 'year', '日期', '时间']
}

function calculateMatchScore(header, fieldKey) {
  const headerLower = String(header).toLowerCase().trim()
  const fieldKeywords = keywords[fieldKey] || []
  
  let score = 0
  
  if (headerLower === fieldKey.toLowerCase()) {
    score += 100
  }
  
  for (const keyword of fieldKeywords) {
    const keywordLower = keyword.toLowerCase()
    
    if (headerLower === keywordLower) {
      score += 50
    } else if (headerLower.includes(keywordLower)) {
      score += 10
    }
    
    const keywordNoSpace = keywordLower.replace(/\s+/g, '')
    const headerNoSpace = headerLower.replace(/\s+/g, '')
    if (headerNoSpace.includes(keywordNoSpace) && keywordNoSpace.length > 1) {
      score += 5
    }
  }
  
  const fieldKeyLower = fieldKey.toLowerCase()
  if (headerLower.includes(fieldKeyLower)) {
    score += 20
  }
  
  return score
}

export function sortHeadersByRelevance(headers, fieldKey) {
  if (!headers || headers.length === 0) return []
  
  const scored = headers.map((header, index) => ({
    header,
    index,
    score: calculateMatchScore(header, fieldKey)
  }))
  
  scored.sort((a, b) => b.score - a.score)
  
  return scored.map(item => ({
    label: item.header,
    value: item.index,
    score: item.score
  }))
}

export function getBestMatch(headers, fieldKey) {
  const sorted = sortHeadersByRelevance(headers, fieldKey)
  return sorted.length > 0 ? sorted[0] : null
}

export function getMatchScore(header, fieldKey) {
  return calculateMatchScore(header, fieldKey)
}
