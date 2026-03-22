<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="700px"
    :close-on-click-modal="false"
    class="product-distribution-modal"
    destroy-on-close
  >
    <div class="modal-content">
      <div class="summary-info">
        <div class="summary-item">
          <span class="summary-label">{{ mainDimensionLabel }}</span>
          <span class="summary-value">{{ mainDimensionName }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">总销售额</span>
          <span class="summary-value">{{ formatMoney(totalValue) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">产品种类</span>
          <span class="summary-value">{{ productList.length }} 种</span>
        </div>
      </div>

      <div class="charts-section">
        <div class="pie-chart-container">
          <div ref="pieChartRef" class="pie-chart"></div>
        </div>
        <div class="product-list">
          <div class="list-header">
            <span class="col-rank">排名</span>
            <span class="col-name">产品名称</span>
            <span class="col-value">销售额</span>
            <span class="col-contrib">占比</span>
          </div>
          <div class="list-body" v-if="productList.length > 0">
            <div
              v-for="(product, index) in productList"
              :key="index"
              class="list-row"
              :class="{ 'top-3': index < 3 }"
            >
              <span class="col-rank">
                <span v-if="index === 0" class="rank-medal gold">🥇</span>
                <span v-else-if="index === 1" class="rank-medal silver">🥈</span>
                <span v-else-if="index === 2" class="rank-medal bronze">🥉</span>
                <span v-else class="rank-number">{{ index + 1 }}</span>
              </span>
              <span class="col-name" :title="product.name">{{ product.name }}</span>
              <span class="col-value">{{ formatMoneyExact(product.value) }}</span>
              <span class="col-contrib">{{ formatPercent(product.contribution, 1) }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无产品数据" :image-size="80" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { formatMoney, formatMoneyExact, formatPercent } from '../utils/formatters.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  mainDimensionName: {
    type: String,
    default: ''
  },
  mainDimensionLabel: {
    type: String,
    default: '员工'
  },
  totalValue: {
    type: Number,
    default: 0
  },
  products: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const pieChartRef = ref(null)
let pieChart = null

const dialogTitle = computed(() => `${props.mainDimensionName} - 产品销售分布`)

const productList = computed(() => {
  return props.products.map((p, idx) => ({
    ...p,
    rank: p.rank || (idx + 1)
  })).sort((a, b) => b.value - a.value)
})

function handleClose() {
  visible.value = false
}

function initChart() {
  if (!pieChartRef.value) return

  if (pieChart) {
    pieChart.dispose()
  }

  pieChart = echarts.init(pieChartRef.value)
  updateChart()
}

function updateChart() {
  if (!pieChart || productList.value.length === 0) return

  const displayProducts = productList.value.length > 8 
    ? productList.value.slice(0, 7) 
    : productList.value

  const pieData = displayProducts.map((item, index) => ({
    name: item.name,
    value: item.value,
    itemStyle: {
      color: getProductColor(index)
    }
  }))

  const otherValue = props.totalValue - pieData.reduce((sum, item) => sum + item.value, 0)
  if (otherValue > 0 && productList.value.length > 8) {
    pieData.push({
      name: '其他',
      value: otherValue,
      itemStyle: { color: '#9ca3af' }
    })
  }

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' },
      formatter: params => {
        return `<div style="padding: 4px;">
          <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
          <div>销售额: ${formatMoney(params.value)}</div>
          <div>占比: ${params.percent.toFixed(1)}%</div>
        </div>`
      }
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#4b5563' },
      formatter: name => {
        const item = productList.value.find(p => p.name === name)
        if (item) {
          return `${name}: ${formatPercent(item.contribution, 0)}`
        }
        return name
      }
    },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      data: pieData
    }]
  }

  pieChart.setOption(option)
}

function getProductColor(index) {
  const colors = [
    ['#fbbf24', '#f59e0b'],
    ['#94a3b8', '#64748b'],
    ['#f97316', '#ea580c'],
    ['#3b82f6', '#2563eb'],
    ['#10b981', '#059669'],
    ['#8b5cf6', '#7c3aed'],
    ['#ec4899', '#db2777']
  ]
  const colorPair = colors[index % colors.length]
  return new echarts.graphic.LinearGradient(0, 0, 1, 1, [
    { offset: 0, color: colorPair[0] },
    { offset: 1, color: colorPair[1] }
  ])
}

watch(visible, (val) => {
  if (val) {
    nextTick(() => {
      initChart()
    })
  }
})

onMounted(() => {
  if (visible.value) {
    nextTick(() => {
      initChart()
    })
  }
})

onBeforeUnmount(() => {
  if (pieChart) {
    pieChart.dispose()
    pieChart = null
  }
})
</script>

<style scoped>
.product-distribution-modal :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 24px;
  margin-right: 0;
  border-radius: 12px 12px 0 0;
}

.product-distribution-modal :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
}

.product-distribution-modal :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
}

.modal-content {
  padding: 0;
}

.summary-info {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #64748b;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.charts-section {
  display: flex;
  gap: 16px;
  padding: 16px;
}

.pie-chart-container {
  width: 280px;
  height: 300px;
  flex-shrink: 0;
}

.pie-chart {
  width: 100%;
  height: 100%;
}

.product-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.list-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.list-body {
  flex: 1;
  overflow-y: auto;
  max-height: 260px;
}

.list-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}

.list-row:hover {
  background: #f8fafc;
}

.list-row.top-3 {
  background: #fefce8;
}

.col-rank {
  width: 50px;
  text-align: center;
}

.col-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 8px;
}

.col-value {
  width: 100px;
  text-align: right;
  padding-right: 8px;
}

.col-contrib {
  width: 60px;
  text-align: right;
  color: #64748b;
}

.rank-medal {
  font-size: 16px;
}

.rank-number {
  color: #94a3b8;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
