export const templates = [
  {
    id: 'top10',
    name: '员工业绩排行榜',
    icon: 'Trophy',
    description: '谁是销冠？谁在拖后腿？',
    requiredFields: [
      { key: 'employee', label: '销售员', type: 'string', placeholder: '如：张三、李四' },
      { key: 'amount', label: '销售额', type: 'number', placeholder: '如：12300.50' }
    ],
    optionalFields: [
      { key: 'product', label: '产品名称', type: 'string', placeholder: '用于分析员工销售的产品分布，可选' },
      { key: 'date', label: '日期', type: 'date', placeholder: '用于时间筛选，可选' }
    ],
    supportsTimeFilter: true
  },
  {
    id: 'product',
    name: '产品销量排行',
    icon: 'Goods',
    description: '什么产品最赚钱？',
    requiredFields: [
      { key: 'product', label: '产品名称', type: 'string', placeholder: '如：iPhone 15' },
      { key: 'amount', label: '销售额', type: 'number', placeholder: '如：9999.00' }
    ],
    optionalFields: [
      { key: 'date', label: '日期', type: 'date', placeholder: '用于时间筛选，可选' }
    ],
    supportsTimeFilter: true
  },
  {
    id: 'comparison',
    name: '销售员业绩对比',
    icon: 'UserFilled',
    description: '团队差距大吗？',
    requiredFields: [
      { key: 'employee', label: '销售员', type: 'string', placeholder: '如：张三、李四' },
      { key: 'amount', label: '销售额', type: 'number', placeholder: '如：50000.00' }
    ],
    optionalFields: [
      { key: 'date', label: '日期', type: 'date', placeholder: '用于时间筛选，可选' }
    ],
    supportsTimeFilter: true
  },
  {
    id: 'region',
    name: '地区销售分布',
    icon: 'MapLocation',
    description: '客户集中在哪？',
    requiredFields: [
      { key: 'region', label: '地区', type: 'string', placeholder: '如：北京、上海' },
      { key: 'amount', label: '销售额', type: 'number', placeholder: '如：100000.00' }
    ],
    optionalFields: [
      { key: 'product', label: '产品名称', type: 'string', placeholder: '用于分析地区销售的产品分布，可选' },
      { key: 'date', label: '日期', type: 'date', placeholder: '用于时间筛选，可选' }
    ],
    supportsTimeFilter: true
  }
]

export function getTemplateById(id) {
  return templates.find(t => t.id === id)
}

export function getAllTemplates() {
  return templates
}
